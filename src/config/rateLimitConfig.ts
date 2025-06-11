// src/config/rateLimitConfig.ts
import { Request } from 'express';
import { getClientIdentifier } from '../types/rateLimit.types';

export const rateLimitConfig = {
  daily: {
    maxRequests: parseInt(process.env.DAILY_RATE_LIMIT || '10'),
    message: 'You have exceeded your daily limit of API calls. Please try again tomorrow.',
    
    // Key generators for different identification methods
    keyGenerators: {
      byIP: (req: Request): string => getClientIdentifier(req),
      
      byUserId: (req: Request): string => {
        // Assuming you have user authentication
        const userId = (req as any).user?.id;
        return userId ? `user:${userId}` : getClientIdentifier(req);
      },
      
      byApiKey: (req: Request): string => {
        const apiKey = req.headers['x-api-key'] as string;
        return apiKey ? `api:${apiKey}` : getClientIdentifier(req);
      },
      
      combined: (req: Request): string => {
        const userId = (req as any).user?.id;
        const apiKey = req.headers['x-api-key'] as string;
        
        if (userId) return `user:${userId}`;
        if (apiKey) return `api:${apiKey}`;
        return `ip:${getClientIdentifier(req)}`;
      }
    }
  },
  
  // Per-minute rate limiting (existing)
  perMinute: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20'),
    message: 'Too many requests from this IP, please try again later.'
  }
};