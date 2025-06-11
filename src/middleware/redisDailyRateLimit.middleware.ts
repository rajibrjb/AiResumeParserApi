// src/middleware/redisDailyRateLimit.ts
import { Request, Response, NextFunction } from 'express';
import { redisManager, redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { getClientIdentifier } from '../types/rateLimit.types';

interface DailyRateLimitOptions {
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

class RedisDailyRateLimitService {
  private keyPrefix = 'daily_limit';

  constructor() {
    // Ensure Redis is connected
    this.ensureConnection();
  }

  private async ensureConnection(): Promise<void> {
    try {
      if (!redisManager.isReady()) {
        await redisManager.connect();
      }
    } catch (error) {
      logger.error('Failed to ensure Redis connection:', error);
    }
  }

  private generateRedisKey(userKey: string): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${this.keyPrefix}:${userKey}:${today}`;
  }

  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Next midnight
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  async checkAndIncrement(userKey: string, maxRequests: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: string;
  }> {
    const redisKey = this.generateRedisKey(userKey);
    const resetTime = new Date();
    resetTime.setHours(23, 59, 59, 999); // End of current day

    try {
      // Check if Redis is available
      if (!redisManager.isReady()) {
        logger.warn('Redis not available, falling back to allow request');
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetTime: resetTime.toISOString()
        };
      }

      // Get current count first
      const currentCountStr = await redisClient.get(redisKey);
      const currentCount = parseInt(currentCountStr || '0');

      // Check if limit already exceeded
      if (currentCount >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: resetTime.toISOString()
        };
      }

      // Increment and set expiry atomically
      const multi = redisClient.multi();
      multi.incr(redisKey);
      multi.expire(redisKey, this.getSecondsUntilMidnight());
      
      const results = await multi.exec();
      
      if (!results || results.length < 2) {
        throw new Error('Redis multi exec failed');
      }

      // Handle Redis multi results properly
      const incrResult = results[0];
      if (incrResult && typeof incrResult === 'object' && 'error' in incrResult) {
        throw incrResult.error;
      }

      const newCount = parseInt(String(incrResult || '1'));

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - newCount),
        resetTime: resetTime.toISOString()
      };

    } catch (error) {
      logger.error('Redis rate limit error:', error);
      // Fail open - allow request if Redis operation fails
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: resetTime.toISOString()
      };
    }
  }

  async getCurrentCount(userKey: string): Promise<number> {
    try {
      if (!redisManager.isReady()) {
        return 0;
      }

      const redisKey = this.generateRedisKey(userKey);
      const count = await redisClient.get(redisKey);
      return parseInt(count || '0');
    } catch (error) {
      logger.error('Error getting current count from Redis:', error);
      return 0;
    }
  }

  async resetUserLimit(userKey: string): Promise<void> {
    try {
      if (!redisManager.isReady()) {
        logger.warn('Redis not available for reset operation');
        return;
      }

      const redisKey = this.generateRedisKey(userKey);
      await redisClient.del(redisKey);
      logger.info(`Reset rate limit for key: ${userKey}`);
    } catch (error) {
      logger.error('Error resetting user limit:', error);
    }
  }

  async getStats(): Promise<{ totalKeys: number; activeUsers: string[] }> {
    try {
      if (!redisManager.isReady()) {
        return { totalKeys: 0, activeUsers: [] };
      }

      const today = new Date().toISOString().split('T')[0];
      const pattern = `${this.keyPrefix}:*:${today}`;
      const keys = await redisClient.keys(pattern);
      
      const activeUsers = keys.map(key => {
        const parts = key.split(':');
        return parts.slice(1, -1).join(':'); // Extract user identifier
      });

      return {
        totalKeys: keys.length,
        activeUsers
      };
    } catch (error) {
      logger.error('Error getting rate limit stats:', error);
      return { totalKeys: 0, activeUsers: [] };
    }
  }
}

// Singleton instance
const redisDailyRateLimitService = new RedisDailyRateLimitService();

export const redisDailyRateLimit = (options: DailyRateLimitOptions) => {
  const {
    maxRequests = 10,
    keyGenerator = (req: Request) => getClientIdentifier(req),
    message = 'Daily API limit exceeded. Please try again tomorrow.'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userKey = keyGenerator(req);
      const result = await redisDailyRateLimitService.checkAndIncrement(userKey, maxRequests);

      // Add headers for client information
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime,
        'X-RateLimit-Reset-After': Math.floor((new Date(result.resetTime).getTime() - Date.now()) / 1000).toString()
      });

      if (!result.allowed) {
        logger.warn(`Daily rate limit exceeded for ${userKey}`);
        return res.status(429).json({
          success: false,
          message,
          resetTime: result.resetTime,
          limit: maxRequests,
          remaining: result.remaining
        });
      }

      next();
    } catch (error) {
      logger.error('Redis daily rate limiter error:', error);
      // Fail open - allow request if rate limiter fails
      next();
    }
  };
};

export { redisDailyRateLimitService };