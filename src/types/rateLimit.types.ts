// src/types/rateLimit.types.ts
import { Request } from 'express';

export interface RateLimitResponse {
  success: boolean;
  message: string;
  resetTime: string;
  limit: number;
  remaining: number;
}

export interface DailyRateLimitOptions {
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export interface RequestCountData {
  count: number;
  date: string;
}

export interface RateLimitStorage {
  [key: string]: RequestCountData;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: string;
}

// Helper function to safely get client identifier
export const getClientIdentifier = (req: Request): string => {
  // Try multiple sources for the client IP
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare
  
  // Handle x-forwarded-for which can be a comma-separated list
  if (forwarded) {
    const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return forwardedIp.split(',')[0].trim();
  }
  
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }
  
  if (cfConnectingIp && typeof cfConnectingIp === 'string') {
    return cfConnectingIp;
  }
  
  // Fallback to req.ip and connection IPs
  return req.ip || 
         req.socket?.remoteAddress || 
         req.connection?.remoteAddress || 
         'unknown';
};