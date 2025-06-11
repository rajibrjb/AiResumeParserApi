import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { rateLimitConfig } from './config/rateLimitConfig';
import { redisManager } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { redisDailyRateLimit } from './middleware/redisDailyRateLimit.middleware';
import { resumeRoutes } from './routes/resumeRoutes';
import { healthRoutes } from './routes/healthRoutes';

const app = express();

// Initialize Redis connection
const initializeRedis = async () => {
  try {
    await redisManager.connect();
    logger.info('✅ Redis connected successfully');
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error);
    logger.warn('⚠️  Rate limiting will fall back to allow all requests');
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'])
    : true,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Configure trust proxy based on environment
if (process.env.NODE_ENV === 'production') {
  // In production, trust the first proxy (load balancer/reverse proxy)
  app.set('trust proxy', 1);
  logger.info('🔒 Trust proxy set to 1 (production mode)');
} else {
  // In development, trust local proxies
  app.set('trust proxy', 'loopback');
  logger.info('🔒 Trust proxy set to loopback (development mode)');
}

// Per-minute rate limiting (general protection)
const limiter = rateLimit({
  windowMs: rateLimitConfig.perMinute.windowMs,
  max: rateLimitConfig.perMinute.maxRequests,
  message: {
    success: false,
    message: rateLimitConfig.perMinute.message,
    type: 'rate_limit_exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health endpoints
  skip: (req) => req.path.startsWith('/health'),
  // Custom key generator for better IP detection
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    
    if (forwarded) {
      const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return forwardedIp.split(',')[0].trim();
    }
    
    if (realIp && typeof realIp === 'string') {
      return realIp;
    }
    
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }
});

app.use(limiter);

// Daily rate limiting with Redis (10 calls per day)
app.use('/api/v1/resume', redisDailyRateLimit({
  maxRequests: rateLimitConfig.daily.maxRequests,
  keyGenerator: rateLimitConfig.daily.keyGenerators.combined,
  message: rateLimitConfig.daily.message
}));

// General middleware
app.use(compression());
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Basic JSON bomb protection
    if (buf.length > 10 * 1024 * 1024) {
      throw new Error('Request entity too large');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/api/v1/resume', resumeRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Resume Parser API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      resume: '/api/v1/resume'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = config.port;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  try {
    await redisManager.disconnect();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting Redis:', error);
  }
  
  process.exit(0);
};

// Handle process termination
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  await initializeRedis();
  
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
    logger.info(`📊 Daily rate limit: ${rateLimitConfig.daily.maxRequests} requests per day`);
    logger.info(`🔄 Using Redis for rate limiting`);
    logger.info(`🔒 Trust proxy: ${app.get('trust proxy')}`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;