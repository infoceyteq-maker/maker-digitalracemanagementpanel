// ==============================================================================
// CEYTEQ ENTERPRISE ACCESS & DYNAMIC INVITATION PIPELINE
// Generates and verifies HMAC-SHA256 single-use, time-bound cryptographic tokens
// for First-Time Division Admins, Branch Masters, and Restaurant Owners.
// ==============================================================================

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { DivisionId, SriLankanProvince, PlatformBranch } from './rbacMatrix';

export interface InvitationRecord {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN' | 'RESTAURANT_ADMIN';
  branch: PlatformBranch | 'ALL';
  divisionId?: DivisionId | null;
  allowedProvinces: SriLankanProvince[] | string[];
  tenantId?: string | null;
  tokenHash: string;
  expiresAt: number; // Unix timestamp in ms
  isUsed: boolean;
  createdAt: number;
  usedAt?: number;
}

const INVITATION_SECRET = process.env.INVITATION_SECRET || process.env.NEXTAUTH_SECRET || 'ceyteq_master_invitation_hmac_secret_2026_super_secure';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory token registry for high-speed edge validation (mirrored to Supabase when active)
const invitationRegistry = new Map<string, InvitationRecord>();

/**
 * Creates HMAC-SHA256 hash of the cleartext token
 */
export function hashInvitationToken(token: string): string {
  return crypto.createHmac('sha256', INVITATION_SECRET).update(token).digest('hex');
}

/**
 * Determines deterministic post-login redirect path based on user scope
 */
export function getPostLoginRedirect(user: {
  role: string;
  divisionId?: DivisionId | string | null;
  tenantId?: string | null;
  branch?: string;
}): string {
  switch (user.role) {
    case 'SUPER_MASTER_ADMIN':
    case 'SUPER_ADMIN':
      return '/dashboard/super';

    case 'DIGITAL_RACE_MASTER':
      return '/dashboard/digital-race';

    case 'TASTETRIP_MASTER':
      return '/dashboard/tastetrip';

    case 'DIVISION_ADMIN': {
      if (!user.divisionId) return '/dashboard/division/all';
      // Format division ID to kebab-case e.g. UP_COUNTRY -> up-country
      const slug = user.divisionId.toLowerCase().replace(/_/g, '-');
      return `/dashboard/division/${slug}`;
    }

    case 'RESTAURANT_ADMIN':
    case 'TENANT_OWNER': {
      const tid = user.tenantId || 'default';
      return `/dashboard/restaurant/${tid}`;
    }

    default:
      return '/dashboard';
  }
}

/**
 * Generates a secure, single-use, 24-hour time-bound cryptographic invitation token & URL
 */
export function createInvitation(params: {
  email: string;
  name: string;
  role: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN' | 'RESTAURANT_ADMIN';
  branch?: PlatformBranch | 'ALL';
  divisionId?: DivisionId | null;
  allowedProvinces?: SriLankanProvince[] | string[];
  tenantId?: string | null;
  baseUrl?: string;
}): { token: string; activationUrl: string; record: InvitationRecord } {
  const normalizedEmail = params.email.trim().toLowerCase();
  
  // Generate 32-byte cryptographic random token
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const tokenPayload = `${normalizedEmail}:${Date.now()}:${randomBytes}`;
  const rawToken = Buffer.from(tokenPayload).toString('base64url');
  
  const tokenHash = hashInvitationToken(rawToken);
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

  const record: InvitationRecord = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: normalizedEmail,
    name: params.name,
    role: params.role,
    branch: params.branch || 'DIGITAL_RACE',
    divisionId: params.divisionId || null,
    allowedProvinces: params.allowedProvinces || [],
    tenantId: params.tenantId || null,
    tokenHash,
    expiresAt,
    isUsed: false,
    createdAt: Date.now(),
  };

  invitationRegistry.set(tokenHash, record);

  const base = params.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://maker-digitalracemanagementpanel.vercel.app');
  const activationUrl = `${base}/auth/activate?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(normalizedEmail)}`;

  console.log('[AUTH_STEP: TOKEN_CREATION]', {
    email: normalizedEmail,
    role: params.role,
    divisionId: params.divisionId,
    expiresAt: new Date(expiresAt).toISOString(),
    activationUrl,
  });

  return { token: rawToken, activationUrl, record };
}

/**
 * Validates an invitation token without consuming it
 */
export function verifyInvitationToken(token: string, email: string): {
  isValid: boolean;
  record?: InvitationRecord;
  error?: 'TOKEN_NOT_FOUND' | 'TOKEN_EXPIRED' | 'TOKEN_ALREADY_USED' | 'EMAIL_MISMATCH';
} {
  const normalizedEmail = email.trim().toLowerCase();
  const tokenHash = hashInvitationToken(token);

  console.log('[AUTH_STEP: TOKEN_VERIFICATION]', {
    email: normalizedEmail,
    tokenProvided: !!token,
    timestamp: new Date().toISOString(),
  });

  const record = invitationRegistry.get(tokenHash);

  if (!record) {
    console.warn('[AUTH_STEP: TOKEN_VERIFICATION_FAILED]', { reason: 'TOKEN_NOT_FOUND', email: normalizedEmail });
    return { isValid: false, error: 'TOKEN_NOT_FOUND' };
  }

  if (record.email !== normalizedEmail) {
    console.warn('[AUTH_STEP: TOKEN_VERIFICATION_FAILED]', { reason: 'EMAIL_MISMATCH', email: normalizedEmail });
    return { isValid: false, error: 'EMAIL_MISMATCH' };
  }

  if (record.isUsed) {
    console.warn('[AUTH_STEP: TOKEN_VERIFICATION_FAILED]', { reason: 'TOKEN_ALREADY_USED', email: normalizedEmail });
    return { isValid: false, error: 'TOKEN_ALREADY_USED' };
  }

  if (Date.now() > record.expiresAt) {
    console.warn('[AUTH_STEP: TOKEN_VERIFICATION_FAILED]', { reason: 'TOKEN_EXPIRED', email: normalizedEmail });
    return { isValid: false, error: 'TOKEN_EXPIRED' };
  }

  console.log('[AUTH_STEP: TOKEN_VERIFIED_SUCCESS]', {
    email: normalizedEmail,
    role: record.role,
    divisionId: record.divisionId,
  });

  return { isValid: true, record };
}

/**
 * Consumes the token and sets a bcrypt 12-round permanent password
 */
export async function consumeInvitationAndSetPassword(
  token: string,
  email: string,
  password: string
): Promise<{
  success: boolean;
  passwordHash?: string;
  record?: InvitationRecord;
  redirectUrl?: string;
  error?: string;
}> {
  const validation = verifyInvitationToken(token, email);

  if (!validation.isValid || !validation.record) {
    return { success: false, error: validation.error || 'INVALID_INVITATION_TOKEN' };
  }

  if (password.length < 8) {
    return { success: false, error: 'PASSWORD_TOO_SHORT' };
  }

  // Hash with bcrypt 12 salt rounds
  console.log('[AUTH_STEP: BCRYPT_HASH_GENERATION]', { email, rounds: 12 });
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Invalidate token
  validation.record.isUsed = true;
  validation.record.usedAt = Date.now();

  const redirectUrl = getPostLoginRedirect(validation.record);

  console.log('[AUTH_STEP: ACCOUNT_ACTIVATION_COMPLETE]', {
    email,
    role: validation.record.role,
    divisionId: validation.record.divisionId,
    status: 'ACTIVE',
    redirectUrl,
  });

  return {
    success: true,
    passwordHash,
    record: validation.record,
    redirectUrl,
  };
}
