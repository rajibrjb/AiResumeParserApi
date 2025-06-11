// src/config/redis.ts (Alternative version with better compatibility)
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  database?: number;
}

class RedisManager {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private config: RedisConfig;

  constructor() {
    // Build Redis configuration
    this.config = this.buildConfig();
    this.client = createClient(this.getClientOptions());
    this.setupEventHandlers();
  }

  private buildConfig(): RedisConfig {
    // Support both URL and individual config options
    const redisUrl = process.env.REDIS_URL;
    
    // Check if we have a valid Redis URL
    if (redisUrl && redisUrl !== 'redis://username:password@host:port/database' && redisUrl.startsWith('redis://')) {
      return {
        url: redisUrl,
        password: process.env.REDIS_PASSWORD
      };
    }

    // Fall back to individual config options
    return {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0')
    };
  }

  private getClientOptions() {
    const baseOptions: any = {
      socket: {
        connectTimeout: 5000,
        commandTimeout: 5000,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return false;
          }
          const delay = Math.min(retries * 100, 3000);
          logger.info(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      }
    };

    if (this.config.url) {
      baseOptions.url = this.config.url;
    } else {
      baseOptions.socket.host = this.config.host;
      baseOptions.socket.port = this.config.port;
      baseOptions.database = this.config.database;
    }

    if (this.config.password) {
      baseOptions.password = this.config.password;
    }

    return baseOptions;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis client error:', error.message);
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis client disconnected');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  async connect(): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
        logger.info('✅ Redis connection established');
      }
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      logger.warn('⚠️  Application will continue without Redis (rate limiting will be disabled)');
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client.isOpen) {
        await this.client.quit();
        logger.info('Redis disconnected gracefully');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      try {
        await this.client.disconnect();
      } catch (forceError) {
        logger.error('Error force disconnecting from Redis:', forceError);
      }
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client.isReady;
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.isReady()) return false;
      const startTime = Date.now();
      const result = await this.client.ping();
      const latency = Date.now() - startTime;
      logger.debug(`Redis ping: ${latency}ms`);
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed:', error);
      return false;
    }
  }

  async healthCheck(): Promise<{
    connected: boolean;
    ready: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      const pingResult = await this.ping();
      const latency = Date.now() - startTime;

      return {
        connected: this.client.isOpen,
        ready: this.isConnected,
        latency: pingResult ? latency : undefined,
        error: pingResult ? undefined : 'Ping failed'
      };
    } catch (error) {
      return {
        connected: false,
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getConfig(): RedisConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const redisManager = new RedisManager();
export const redisClient = redisManager.getClient();