import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { resumeRoutes } from './routes/resumeRoutes';
import { healthRoutes } from './routes/healthRoutes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1/resume', resumeRoutes);
app.use('/health', healthRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
});

export default app;