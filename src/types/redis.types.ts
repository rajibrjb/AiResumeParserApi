// src/types/redis.types.ts

export interface RedisConfig {
  url: string;
  password?: string;
  connectTimeout?: number;
  lazyConnect?: boolean;
}

export interface RedisMultiResult {
  error?: Error;
  result?: any;
}

export interface RateLimitRedisData {
  key: string;
  count: number;
  expiry: number;
}

export interface RedisHealthCheck {
  connected: boolean;
  ready: boolean;
  latency?: number;
  error?: string;
}