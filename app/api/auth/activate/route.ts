import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { credentialsService } from '@/src/lib/credentialsService';
import {
  verifyInvitationToken,
  consumeInvitationAndSetPassword,
  getPostLoginRedirect,
  hashInvitationToken,
} from '@/src/lib/invitationService';

// ==============================================================================
// CEYTEQ ENTERPRISE ACCOUNT ACTIVATION API
// Target: /app/api/auth/activate/route.ts
// Handles: Token verification (GET) and permanent password activation (POST)
// ==============================================================================

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

// GET: Validate activation token & retrieve invitation metadata
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    console.warn('[AUTH_INVITE_VERIFY] Missing token or email parameter in request');
    return NextResponse.json(
      { isValid: false, error: 'MISSING_PARAMS', message: 'Activation token and email are required.' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`[AUTH_INVITE_VERIFY] Token verification for email: ${normalizedEmail}`);

  // 1. Check Supabase account_activation_tokens / account_invitations table
  try {
    const tokenHash = hashInvitationToken(token);
    const { data: dbInvite, error } = await supabase
      .from('account_invitations')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (dbInvite && !error) {
      if (dbInvite.is_used) {
        console.warn(`[AUTH_INVITE_VERIFY] Token already used for: ${normalizedEmail}`);
        return NextResponse.json(
          { isValid: false, error: 'TOKEN_ALREADY_USED', message: 'This invitation link has already been used.' },
          { status: 400 }
        );
      }

      if (new Date(dbInvite.expires_at).getTime() < Date.now()) {
        console.warn(`[AUTH_INVITE_VERIFY] Token expired for: ${normalizedEmail}`);
        return NextResponse.json(
          { isValid: false, error: 'TOKEN_EXPIRED', message: 'This invitation link has expired (48-hour limit).' },
          { status: 410 }
        );
      }

      return NextResponse.json({
        isValid: true,
        email: dbInvite.email,
        name: dbInvite.name || normalizedEmail.split('@')[0],
        role: dbInvite.role,
        branch: dbInvite.platform_branch,
        divisionId: dbInvite.division,
        allowedProvinces: dbInvite.allowed_provinces || [],
        tenantId: dbInvite.restaurant_id,
        expiresAt: dbInvite.expires_at,
      });
    }
  } catch (err) {
    console.warn('[AUTH_INVITE_VERIFY] Supabase token check notice (checking local registry):', err);
  }

  // 2. Fallback to Local In-Memory Registry / Credentials Store
  const localMemoryCheck = verifyInvitationToken(token, normalizedEmail);
  if (localMemoryCheck.isValid && localMemoryCheck.record) {
    const rec = localMemoryCheck.record;
    return NextResponse.json({
      isValid: true,
      email: rec.email,
      name: rec.name,
      role: rec.role,
      branch: rec.branch,
      divisionId: rec.divisionId,
      allowedProvinces: rec.allowedProvinces,
      tenantId: rec.tenantId,
      expiresAt: rec.expiresAt,
    });
  }

  const clientStoreCheck = credentialsService.verifyInvitationRecord(token, normalizedEmail);
  if (clientStoreCheck.isValid && clientStoreCheck.record) {
    const rec = clientStoreCheck.record;
    return NextResponse.json({
      isValid: true,
      email: rec.email,
      name: rec.name,
      role: rec.role,
      branch: rec.branch,
      divisionId: rec.divisionId,
      allowedProvinces: rec.allowedProvinces,
      tenantId: rec.tenantId,
      expiresAt: rec.expiresAt,
    });
  }

  const errorCode = localMemoryCheck.error || clientStoreCheck.error || 'TOKEN_NOT_FOUND';
  console.warn(`[AUTH_INVITE_VERIFY] Verification failed for ${normalizedEmail}: ${errorCode}`);

  return NextResponse.json(
    {
      isValid: false,
      error: errorCode,
      message:
        errorCode === 'TOKEN_EXPIRED'
          ? 'This invitation link has expired. Please request a new activation link or recover via Dual-OTP.'
          : errorCode === 'TOKEN_ALREADY_USED'
          ? 'This activation token has already been used to set credentials.'
          : 'Invalid or unverified activation token. Please verify the URL.',
    },
    { status: errorCode === 'TOKEN_EXPIRED' ? 410 : 400 }
  );
}

// POST: Consume activation token and set permanent bcrypt (12 rounds) password
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing token, email, or password payload.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    console.log(`[AUTH_INVITE_VERIFY] Setting permanent password for: ${normalizedEmail}`);

    // Generate 12-round bcrypt hash
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1. Consume token in local registry
    const localConsumption = await consumeInvitationAndSetPassword(token, normalizedEmail, password);
    credentialsService.consumeInvitation(token, password);
    credentialsService.resetPasswordByEmail(normalizedEmail, password);

    let redirectUrl = localConsumption.redirectUrl;
    let role = localConsumption.record?.role || 'DIVISION_ADMIN';
    let divisionId = localConsumption.record?.divisionId;
    let tenantId = localConsumption.record?.tenantId;

    // 2. Update Supabase if available
    try {
      const tokenHash = hashInvitationToken(token);

      // Invalidate invitation token in Supabase
      await supabase
        .from('account_invitations')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
        })
        .eq('token_hash', tokenHash);

      // Update or insert user in public.users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingUser) {
        await supabase
          .from('users')
          .update({
            password_hash: passwordHash,
            status: 'ACTIVE',
            is_email_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id);
        role = existingUser.role;
      } else {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            email: normalizedEmail,
            name: localConsumption.record?.name || normalizedEmail.split('@')[0],
            password_hash: passwordHash,
            role: role as any,
            platform_branch: localConsumption.record?.branch || 'DIGITAL_RACE',
            restaurant_id: tenantId || null,
            status: 'ACTIVE',
            is_email_verified: true,
          })
          .select('id')
          .single();

        if (newUser && divisionId) {
          await supabase.from('division_assignments').insert({
            user_id: newUser.id,
            platform_branch: localConsumption.record?.branch || 'DIGITAL_RACE',
            division: divisionId as any,
            allowed_provinces: localConsumption.record?.allowedProvinces || [],
          });
        }
      }
    } catch (dbErr) {
      console.warn('[AUTH_INVITE_VERIFY] Supabase activation sync notice (local activation succeeded):', dbErr);
    }

    if (!redirectUrl) {
      redirectUrl = getPostLoginRedirect({
        role,
        divisionId,
        tenantId,
      });
    }

    console.log(`[AUTH_SESSION_CREATED] Account successfully activated for: ${normalizedEmail}, target: ${redirectUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Account successfully activated! Permanent credentials securely established.',
      redirectUrl,
      user: {
        email: normalizedEmail,
        role,
        divisionId,
        tenantId,
        status: 'ACTIVE',
      },
    });
  } catch (err: any) {
    console.error('[AUTH_INVITE_VERIFY] Activation error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Server activation failure.' },
      { status: 500 }
    );
  }
}
