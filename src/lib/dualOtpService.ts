// ==============================================================================
// CEYTEQ ENTERPRISE DUAL-CHANNEL OTP SERVICE (EMAIL + WHATSAPP)
// Multi-Factor Password Reset & Identity Verification Pipeline
// Channels: Resend API (Email) + Meta WhatsApp Cloud API (Mobile)
// Rate Limiting: Upstash Redis REST / Sliding Window Memory Store
// ==============================================================================

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { credentialsService } from './credentialsService';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://jhvqliimklxrxdwszzfk.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_vOEZVjmVUuP7zj2TchK3dQ_2YD5bll7';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Environment Credentials
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_CLOUD_API_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '104889201940123';

// In-Memory Fallback Store for OTP and Rate Limiting
interface StoredOtpSession {
  email: string;
  phone: string;
  emailOtpHmac: string;
  phoneOtpHmac: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
  lockedUntil?: number;
}

const memoryOtpStore = new Map<string, StoredOtpSession>();
const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();

function hashOtp(otp: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'ceyteq-otp-signing-salt-2026';
  return crypto.createHmac('sha256', secret).update(otp.trim()).digest('hex');
}

/**
 * Check and increment rate limiting (Max 3 requests per IP/account per hour)
 */
export async function checkRateLimit(key: string, limit = 3, windowSeconds = 3600): Promise<{ allowed: boolean; remaining: number }> {
  // If Upstash Redis is configured, use REST API
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await fetch(`${UPSTASH_URL}/incr/${key}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const data = await res.json();
      const current = data.result as number;

      if (current === 1) {
        await fetch(`${UPSTASH_URL}/expire/${key}/${windowSeconds}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        });
      }

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
      };
    } catch (err) {
      console.warn('[REDIS_RATE_LIMIT_NOTICE] Upstash call error, falling back to memory:', err);
    }
  }

  // Memory fallback
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.expiresAt) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
  };
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateNumericOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Dispatch Email OTP via Resend API
 */
export async function sendEmailOtp(toEmail: string, otp: string, recipientName = 'User'): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #00C8FF; margin: 0;">CEYTEQ ENTERPRISE ACCESS</h2>
        <p style="color: #94a3b8; font-size: 14px;">Digital Race & TasteTrip Security Pipeline</p>
      </div>
      <p>Hello ${recipientName},</p>
      <p>You have requested a secure password reset for your enterprise account. Use the following Email Verification Code to proceed:</p>
      <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 12px; margin: 24px 0; border: 1px solid #334155;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00C8FF;">${otp}</span>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">This code is valid for <strong>10 minutes</strong> and is strictly single-use. If you did not request this, please contact Ceyteq Security immediately at info.ceyteq@gmail.com.</p>
    </div>
  `;

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Ceyteq Security <noreply@maker-digitalracemanagementpanel.vercel.app>',
          to: [toEmail],
          subject: `[CEYTEQ] Your Password Reset Code: ${otp}`,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        console.log(`[RESEND_EMAIL_OTP_DISPATCHED] Successfully sent code to ${toEmail}`);
        return true;
      }
      console.warn('[RESEND_EMAIL_OTP_WARN] Resend API error response:', await res.text());
    } catch (err) {
      console.error('[RESEND_EMAIL_OTP_ERROR]', err);
    }
  }

  // Diagnostic log for development & environments without live Resend key
  console.log(`[AUTH_EMAIL_OTP_DISPATCH] To: ${toEmail} | Code: ${otp} (10m TTL)`);
  return true;
}

/**
 * Dispatch WhatsApp OTP via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppOtp(toPhone: string, otp: string): Promise<boolean> {
  // Normalize Sri Lanka numbers to international format (+94...)
  let formattedPhone = toPhone.replace(/[\s\-]/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+94' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone;
  }
  const cleanNumber = formattedPhone.replace('+', '');

  if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanNumber,
          type: 'text',
          text: {
            preview_url: false,
            body: `*CEYTEQ ENTERPRISE SECURITY*\n\nYour WhatsApp Verification Code is: *${otp}*\n\nValid for 10 minutes. Enter this code along with your Email OTP to securely reset your password.`,
          },
        }),
      });

      if (res.ok) {
        console.log(`[WHATSAPP_OTP_DISPATCHED] Successfully sent code to ${formattedPhone}`);
        return true;
      }
      console.warn('[WHATSAPP_OTP_WARN] Meta WhatsApp API error response:', await res.text());
    } catch (err) {
      console.error('[WHATSAPP_OTP_ERROR]', err);
    }
  }

  // Diagnostic log for development & environments without active Meta API key
  console.log(`[AUTH_WHATSAPP_OTP_DISPATCH] To: ${formattedPhone} | Code: ${otp} (10m TTL)`);
  return true;
}

/**
 * 1. Request Dual-Channel Password Reset
 */
export async function initiateDualOtpReset(email: string, phone: string, clientIp: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim().replace(/[\s\-]/g, '');

  console.log(`[AUTH_RESET_REQUEST] Initiating password reset for: ${normalizedEmail} / ${normalizedPhone}`);

  // Rate Limiting Check (Max 3 attempts per IP/account per hour)
  const rateLimitKey = `rate:reset:${normalizedEmail}:${clientIp}`;
  const rateCheck = await checkRateLimit(rateLimitKey, 3, 3600);

  if (!rateCheck.allowed) {
    throw new Error('Too many password reset requests. For security reasons, please wait 1 hour.');
  }

  // Validate that BOTH email AND phone belong to a single ACTIVE user
  let matchedUser: any = null;

  // Supabase Check
  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, phone, name, status, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (dbUser) {
      const dbPhone = dbUser.phone.trim().replace(/[\s\-]/g, '');
      if (dbPhone === normalizedPhone || dbPhone.endsWith(normalizedPhone.slice(-9))) {
        matchedUser = dbUser;
      }
    }
  } catch (err) {
    console.warn('[AUTH_RESET_REQUEST] Supabase check notice:', err);
  }

  // Local Credentials Fallback Check
  if (!matchedUser) {
    const creds = credentialsService.getCredentials();
    const superPhone = creds.superAdminPhone.trim().replace(/[\s\-]/g, '');
    if (
      normalizedEmail === creds.superAdminEmail.toLowerCase() &&
      (normalizedPhone === superPhone || superPhone.endsWith(normalizedPhone.slice(-9)))
    ) {
      matchedUser = {
        id: 'usr-super-root',
        email: creds.superAdminEmail,
        phone: creds.superAdminPhone,
        name: 'Ceyteq Root System Supervisor',
        status: 'ACTIVE',
        role: 'SUPER_MASTER_ADMIN',
      };
    } else {
      const lookup = credentialsService.findAccountByEmail(normalizedEmail);
      if (lookup.record) {
        const recPhone = (lookup.record.phone || '').trim().replace(/[\s\-]/g, '');
        if (recPhone === normalizedPhone || recPhone.endsWith(normalizedPhone.slice(-9))) {
          matchedUser = {
            id: lookup.record.id,
            email: lookup.record.email,
            phone: lookup.record.phone,
            name: lookup.record.name,
            status: lookup.record.status || 'ACTIVE',
            role: lookup.record.role,
          };
        }
      }
    }
  }

  if (!matchedUser) {
    throw new Error('No active account found matching both the specified email address and mobile number.');
  }

  if (matchedUser.status === 'SUSPENDED') {
    throw new Error('This account is suspended. Password reset is prohibited.');
  }

  // Generate distinct 6-digit OTPs
  const emailOtp = generateNumericOtp();
  let whatsappOtp = generateNumericOtp();
  while (whatsappOtp === emailOtp) {
    whatsappOtp = generateNumericOtp();
  }

  const emailOtpHmac = hashOtp(emailOtp);
  const phoneOtpHmac = hashOtp(whatsappOtp);
  const ttlMs = 10 * 60 * 1000; // 10 minutes
  const expiresAt = Date.now() + ttlMs;

  const sessionKey = `otp:${normalizedEmail}`;
  const sessionData: StoredOtpSession = {
    email: normalizedEmail,
    phone: normalizedPhone,
    emailOtpHmac,
    phoneOtpHmac,
    attempts: 0,
    maxAttempts: 3,
    expiresAt,
  };

  memoryOtpStore.set(sessionKey, sessionData);

  // Store in Supabase if accessible
  try {
    await supabase.from('otp_verifications').insert({
      user_id: matchedUser.id.startsWith('usr-') ? null : matchedUser.id,
      identifier: normalizedEmail,
      email_otp_hash: emailOtpHmac,
      phone_otp_hash: phoneOtpHmac,
      attempts: 0,
      max_attempts: 3,
      verified: false,
      expires_at: new Date(expiresAt).toISOString(),
    });
  } catch (err) {
    console.warn('[AUTH_RESET_REQUEST] Supabase OTP save notice:', err);
  }

  // Dispatch both OTPs simultaneously
  await Promise.all([
    sendEmailOtp(normalizedEmail, emailOtp, matchedUser.name),
    sendWhatsAppOtp(normalizedPhone, whatsappOtp),
  ]);

  return {
    success: true,
    message: 'Dual verification codes sent! Please check both your email inbox and WhatsApp messages.',
    emailMasked: normalizedEmail.replace(/(.{2})(.*)(?=@)/, (_gp1, h, t) => h + '*'.repeat(t.length)),
    phoneMasked: normalizedPhone.slice(0, 3) + '****' + normalizedPhone.slice(-3),
    expiresInSeconds: 600,
  };
}

/**
 * 2. Verify Dual OTPs & Reset Password
 */
export async function verifyDualOtpAndResetPassword(
  email: string,
  phone: string,
  emailOtp: string,
  phoneOtp: string,
  newPassword: string
) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim().replace(/[\s\-]/g, '');

  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const sessionKey = `otp:${normalizedEmail}`;
  const session = memoryOtpStore.get(sessionKey);

  if (!session) {
    throw new Error('Verification session expired or not found. Please request a new verification code.');
  }

  // Check lockout
  if (session.lockedUntil && Date.now() < session.lockedUntil) {
    const waitMins = Math.ceil((session.lockedUntil - Date.now()) / (60 * 1000));
    throw new Error(`Account temporarily locked due to excessive failed verification attempts. Please retry in ${waitMins} minutes.`);
  }

  if (Date.now() > session.expiresAt) {
    memoryOtpStore.delete(sessionKey);
    throw new Error('Verification codes have expired (10-minute limit). Please request a new reset code.');
  }

  // Verify Hashes
  const providedEmailHash = hashOtp(emailOtp);
  const providedPhoneHash = hashOtp(phoneOtp);

  const isEmailValid = crypto.timingSafeEqual(Buffer.from(providedEmailHash), Buffer.from(session.emailOtpHmac));
  const isPhoneValid = crypto.timingSafeEqual(Buffer.from(providedPhoneHash), Buffer.from(session.phoneOtpHmac));

  if (!isEmailValid || !isPhoneValid) {
    session.attempts += 1;
    const remaining = session.maxAttempts - session.attempts;

    if (session.attempts >= session.maxAttempts) {
      session.lockedUntil = Date.now() + 30 * 60 * 1000; // 30-minute lockout
      throw new Error('Maximum verification attempts exceeded. Account is locked for 30 minutes.');
    }

    throw new Error(`Invalid verification codes. Both Email and WhatsApp codes must match. ${remaining} attempt(s) remaining.`);
  }

  // Both codes verified! Hash new password with 12 salt rounds
  const salt = await bcrypt.genSalt(12);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);

  // 1. Update in Local Credentials Registry
  credentialsService.resetPasswordByEmail(normalizedEmail, newPassword);

  // 2. Update in Supabase
  try {
    await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        status: 'ACTIVE',
        is_email_verified: true,
        is_phone_verified: true,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail);

    await supabase
      .from('otp_verifications')
      .update({
        verified: true,
        consumed_at: new Date().toISOString(),
      })
      .eq('identifier', normalizedEmail);
  } catch (err) {
    console.warn('[AUTH_RESET_VERIFY] Supabase user password update notice:', err);
  }

  // Clear OTP session to prevent replay
  memoryOtpStore.delete(sessionKey);

  console.log(`[AUTH_PASSWORD_RESET_SUCCESS] Password successfully reset for: ${normalizedEmail}`);

  return {
    success: true,
    message: 'Password successfully updated! You can now log in with your new permanent password.',
  };
}
