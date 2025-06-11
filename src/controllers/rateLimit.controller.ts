import { Request, Response } from 'express';
import { redisDailyRateLimitService } from '../middleware/redisDailyRateLimit.middleware';
import { logger } from '../utils/logger';

export class RateLimitController {
  /**
   * Get current rate limit status for a user/IP
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(400).json({
          success: false,
          message: 'Key parameter is required'
        });
        return;
      }

      const currentCount = await redisDailyRateLimitService.getCurrentCount(key);
      const resetTime = new Date();
      resetTime.setHours(23, 59, 59, 999);

      res.json({
        success: true,
        data: {
          key,
          currentCount,
          maxRequests: 10, // Could be configurable
          remaining: Math.max(0, 10 - currentCount),
          resetTime: resetTime.toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting rate limit status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Reset rate limit for a specific user/IP (admin only)
   */
  async resetLimit(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(400).json({
          success: false,
          message: 'Key parameter is required'
        });
        return;
      }

      await redisDailyRateLimitService.resetUserLimit(key);

      res.json({
        success: true,
        message: `Rate limit reset for key: ${key}`
      });
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get rate limiting statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await redisDailyRateLimitService.getStats();

      res.json({
        success: true,
        data: {
          totalActiveUsers: stats.totalKeys,
          activeUsers: stats.activeUsers,
          date: new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      logger.error('Error getting rate limit stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}