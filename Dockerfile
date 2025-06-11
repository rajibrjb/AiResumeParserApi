FROM node:18-alpine AS builder

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files for production install
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create inline health check script
RUN echo 'const http = require("http"); \
const options = { host: "localhost", port: process.env.PORT || 3000, path: "/health", timeout: 2000 }; \
const request = http.request(options, (res) => { \
  if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } \
}); \
request.on("error", () => { process.exit(1); }); \
request.on("timeout", () => { request.destroy(); process.exit(1); }); \
request.end();' > healthcheck.js && \
chown nodejs:nodejs healthcheck.js

# Create necessary directories
RUN mkdir -p uploads data && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/server.js"]