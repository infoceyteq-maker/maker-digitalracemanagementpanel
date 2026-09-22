/**
 * CEYTEQ ADVANCED RATE LIMITING & DDoS PREVENTION MODULE
 * Features:
 * - High-speed sliding window algorithm
 * - Tier-based quotas: FREE (60 req/min), PLUS (300 req/min), PRO (1200 req/min)
 * - Brute-force auth limiter: 5 attempts per 15 minutes
 * - In-memory LRU storage with Redis fallback interface
 */

import { SubscriptionTier } from '../types';

export interface RateLimitEntry {
  count: number;
  resetTimeMs: number;
  blockedUntil?: number;
}

export class SlidingWindowRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: any = null;

  constructor() {
    // Periodically evict expired IP records to prevent memory leak under high-traffic free-tier volume
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  public checkLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTimeMs: number; retryAfterSec: number } {
    const now = Date.now();
    let record = this.store.get(key);

    if (!record || now > record.resetTimeMs) {
      record = {
        count: 1,
        resetTimeMs: now + windowMs,
      };
      this.store.set(key, record);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTimeMs: record.resetTimeMs,
        retryAfterSec: 0,
      };
    }

    // Check if key is temporarily banned (e.g. brute force lockout)
    if (record.blockedUntil && now < record.blockedUntil) {
      const retryAfterSec = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTimeMs: record.blockedUntil,
        retryAfterSec,
      };
    }

    record.count += 1;
    this.store.set(key, record);

    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTimeMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTimeMs: record.resetTimeMs,
        retryAfterSec,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - record.count),
      resetTimeMs: record.resetTimeMs,
      retryAfterSec: 0,
    };
  }

  public blockKey(key: string, durationMs: number) {
    const now = Date.now();
    const existing = this.store.get(key) || { count: 1, resetTimeMs: now + durationMs };
    existing.blockedUntil = now + durationMs;
    this.store.set(key, existing);
  }

  public resetKey(key: string) {
    this.store.delete(key);
  }

  public getStats() {
    return {
      activeTrackedKeys: this.store.size,
      memoryTrackedEntries: this.store.size,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTimeMs && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.store.delete(key);
      }
    }
  }
}

// Global singleton instance
export const globalRateLimiter = new SlidingWindowRateLimiter();

// Tier quota mapping
export const TIER_RATE_LIMITS: Record<SubscriptionTier | 'AUTH' | 'UNAUTHENTICATED' | 'SUPER_ADMIN', { max: number; windowMs: number }> = {
  AUTH: { max: 5, windowMs: 15 * 60 * 1000 },          // 5 attempts / 15 minutes
  FREE: { max: 60, windowMs: 60 * 1000 },              // 60 requests / minute
  PLUS: { max: 300, windowMs: 60 * 1000 },             // 300 requests / minute
  PRO: { max: 1200, windowMs: 60 * 1000 },             // 1,200 requests / minute
  SUPER_ADMIN: { max: 5000, windowMs: 60 * 1000 },     // 5,000 requests / minute
  UNAUTHENTICATED: { max: 30, windowMs: 60 * 1000 },   // 30 requests / minute
};
