import { Request, Response } from 'express';
import { redisManager } from '../config/redis';
import { logger } from '../utils/logger';

// Helper functions
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function maskRedisUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '***';
    }
    return urlObj.toString();
  } catch {
    return url.replace(/:([^@/]+)@/, ':***@');
  }
}

export class HealthController {
  /**
   * Basic health check - Returns 200 for healthy, 503 for unhealthy
   * This endpoint is designed to work with your existing health check script
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const redisHealth = await redisManager.healthCheck();
      
      // For backward compatibility, we'll consider the service healthy
      // even if Redis is down (since rate limiting fails open)
      const isHealthy = true; // You can change this to: redisHealth.connected
      
      if (isHealthy) {
        res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            api: 'operational',
            redis: redisHealth.connected ? 'operational' : 'degraded'
          }
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            api: 'operational',
            redis: 'failed'
          }
        });
      }
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  }

  /**
   * Detailed system status with comprehensive information
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const redisHealth = await redisManager.healthCheck();
      
      const status = {
        application: {
          name: 'Resume API',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: Math.floor(process.uptime()),
          uptimeHuman: formatUptime(process.uptime()),
          memory: {
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
          },
          pid: process.pid,
          nodeVersion: process.version
        },
        services: {
          api: {
            status: 'operational',
            port: process.env.PORT || 3000
          },
          redis: {
            status: redisHealth.connected ? 'operational' : 'disconnected',
            connected: redisHealth.connected,
            ready: redisHealth.ready,
            latency: redisHealth.latency ? `${redisHealth.latency}ms` : 'N/A',
            url: maskRedisUrl(process.env.REDIS_URL || 'redis://localhost:6379'),
            error: redisHealth.error
          }
        },
        rateLimiting: {
          dailyLimit: parseInt(process.env.DAILY_RATE_LIMIT || '10'),
          provider: redisHealth.connected ? 'redis' : 'fallback (allow all)'
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Readiness probe - checks if the service is ready to handle requests
   */
  async getReady(req: Request, res: Response): Promise<void> {
    try {
      // Check if critical services are ready
      const redisHealth = await redisManager.healthCheck();
      
      const isReady = true; // Service is ready even without Redis
      
      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Readiness check error:', error);
      res.status(503).json({
        status: 'not ready',
        error: 'Readiness check failed'
      });
    }
  }

  /**
   * Liveness probe - checks if the service is alive
   */
  async getLive(req: Request, res: Response): Promise<void> {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  }
}