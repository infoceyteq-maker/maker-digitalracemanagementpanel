/**
 * ==============================================================================
 * CEYTEQ DIGITAL RACE - UPSTASH REDIS RATE LIMITER & CYBERSECURITY GUARD
 * 
 * Provides:
 * 1. Strict limit on Auth & Dual-OTP endpoints (5 req/min)
 * 2. Standard limit on Public & Tenant API routes (100 req/min)
 * 3. Zero-Trust brute force protection (Max 3 failed OTP attempts -> 15 min lockout)
 * 4. High-availability sliding-window counter with fallback to local secure cache
 * ==============================================================================
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds?: number;
}

interface LocalMemoryBucket {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const localCache = new Map<string, LocalMemoryBucket>();

export class UpstashRateLimiter {
  private redisUrl: string;
  private redisToken: string;

  constructor() {
    this.redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
    this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  }

  /**
   * Check sliding window rate limit
   * @param identifier IP or user email
   * @param limit Max allowed requests
   * @param windowSeconds Window duration in seconds
   */
  async limit(identifier: string, limit: number = 100, windowSeconds: number = 60): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // 1. If Upstash Redis credentials are provided, use HTTP REST Pipeline
    if (this.redisUrl && this.redisToken) {
      try {
        const response = await fetch(`${this.redisUrl}/pipeline`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ['INCR', key],
            ['EXPIRE', key, windowSeconds],
          ]),
        });

        if (response.ok) {
          const results = await response.json();
          const currentCount = results[0]?.result ?? 1;
          const remaining = Math.max(0, limit - currentCount);
          const success = currentCount <= limit;

          return {
            success,
            limit,
            remaining,
            resetTimeMs: now + windowMs,
            retryAfterSeconds: success ? undefined : Math.ceil(windowSeconds),
          };
        }
      } catch (err) {
        console.warn('⚠️ [RATELIMIT] Upstash Redis call failed, failing over to local edge cache:', err);
      }
    }

    // 2. High-speed Fallback Memory Bucket (Edge & Local Serverless)
    let bucket = localCache.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + windowMs };
      localCache.set(key, bucket);
      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetTimeMs: bucket.resetAt,
      };
    }

    bucket.count += 1;
    const remaining = Math.max(0, limit - bucket.count);
    const success = bucket.count <= limit;
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);

    return {
      success,
      limit,
      remaining,
      resetTimeMs: bucket.resetAt,
      retryAfterSeconds: success ? undefined : retryAfter,
    };
  }

  /**
   * Brute Force Defense for Dual-OTP verification
   * Max 3 failed attempts per user before 15-minute complete lockout
   */
  async recordFailedOtpAttempt(userIdOrEmail: string): Promise<{ locked: boolean; attemptsLeft: number; lockoutMinutes?: number }> {
    const lockKey = `otp_attempts:${userIdOrEmail.toLowerCase().trim()}`;
    const now = Date.now();
    let record = localCache.get(lockKey);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + 15 * 60 * 1000 };
    } else {
      record.count += 1;
    }

    if (record.count >= 3) {
      record.lockedUntil = now + 15 * 60 * 1000;
      localCache.set(lockKey, record);
      return { locked: true, attemptsLeft: 0, lockoutMinutes: 15 };
    }

    localCache.set(lockKey, record);
    return { locked: false, attemptsLeft: 3 - record.count };
  }

  /**
   * Check if user is currently locked out from OTP attempts
   */
  isUserLockedOut(userIdOrEmail: string): { locked: boolean; remainingSeconds: number } {
    const lockKey = `otp_attempts:${userIdOrEmail.toLowerCase().trim()}`;
    const record = localCache.get(lockKey);
    const now = Date.now();

    if (record?.lockedUntil && record.lockedUntil > now) {
      return {
        locked: true,
        remainingSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      };
    }

    return { locked: false, remainingSeconds: 0 };
  }

  /**
   * Clear lockout on successful verification
   */
  clearOtpAttempts(userIdOrEmail: string): void {
    const lockKey = `otp_attempts:${userIdOrEmail.toLowerCase().trim()}`;
    localCache.delete(lockKey);
  }
}

export const rateLimiter = new UpstashRateLimiter();
