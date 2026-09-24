import { UserRole, SubscriptionTier } from '../types';

/**
 * Digital Race RBAC hierarchy (authoritative role names).
 * Concrete UserRole union lives in src/types.ts; this documents the admin ladder:
 *
 * SUPER_MASTER_ADMIN — full control; create/delete every admin & division
 * MASTER_ADMIN       — everything except deleting SUPER_MASTER_ADMIN
 * AGENCY_ADMIN       — manages DIVISION_ADMINs + tenants in assigned divisions
 * DIVISION_ADMIN     — own division's tenants + orders; can edit menus
 * FRONT              — restaurant staff; menu edit w/ approval; no admin mgmt
 * CUSTOMER           — public QR menu only
 */
export type RbacAdminRole =
  | 'SUPER_MASTER_ADMIN'
  | 'MASTER_ADMIN'
  | 'AGENCY_ADMIN'
  | 'DIVISION_ADMIN'
  | 'FRONT'
  | 'CUSTOMER';

export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED_BRUTE_FORCE';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  tier: SubscriptionTier;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  status: AccountStatus;
  failedLoginAttempts: number;
  lockoutUntil?: number;
  lastLogin?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  eventType: 
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'BRUTE_FORCE_BLOCKED'
    | 'OTP_SENT'
    | 'OTP_VERIFIED'
    | 'MFA_CHALLENGE_SUCCESS'
    | 'MFA_CHALLENGE_FAILED'
    | 'SQL_INJECTION_BLOCKED'
    | 'XSS_ATTACK_BLOCKED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'UNAUTHORIZED_TIER_ACCESS_BLOCKED'
    | 'CSRF_BLOCKED';
  ipAddress: string;
  userAgent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  userId?: string;
  tenantId?: string;
}

export interface RateLimitTierConfig {
  tier: SubscriptionTier | 'UNAUTHENTICATED' | 'SUPER_ADMIN';
  windowMs: number;
  maxRequests: number;
  description: string;
}

export interface RateLimitStatus {
  ip: string;
  currentRequests: number;
  maxRequests: number;
  remaining: number;
  resetTimeMs: number;
  tier: string;
  isBlocked: boolean;
}

export interface SecurityStats {
  totalRequests: number;
  blockedAttacks: number;
  activeRateLimits: number;
  cacheHitRatio: number;
  averageLatencyMs: number;
  mfaAdoptionRate: number;
  recentLogs: SecurityAuditLog[];
}
