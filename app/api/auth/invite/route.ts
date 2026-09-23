import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createInvitation, hashInvitationToken } from '@/src/lib/invitationService';
import { credentialsService } from '@/src/lib/credentialsService';

// ==============================================================================
// CEYTEQ ENTERPRISE ACCOUNT PROVISIONING & INVITATION API
// Target: /app/api/auth/invite/route.ts
// Handles: Provisioning users in PENDING_ACTIVATION status & issuing HMAC tokens
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, role, branch, divisionId, allowedProvinces, tenantId, phone } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { success: false, message: 'Email, name, and role are required fields.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log('[AUTH_INVITE_CREATE]', {
      email: normalizedEmail,
      name,
      role,
      divisionId,
      branch: branch || 'DIGITAL_RACE',
      timestamp: new Date().toISOString(),
    });

    // 1. Generate HMAC-SHA256 48-hour activation token
    const invitation = createInvitation({
      email: normalizedEmail,
      name,
      role,
      branch: branch || 'DIGITAL_RACE',
      divisionId: divisionId || null,
      allowedProvinces: allowedProvinces || [],
      tenantId: tenantId || null,
      baseUrl: 'https://maker-digitalracemanagementpanel.vercel.app',
    });

    // 2. Persist to local client credentials registry
    try {
      credentialsService.createInvitationRecord({
        email: normalizedEmail,
        name,
        role,
        branch: branch || 'DIGITAL_RACE',
        divisionId: divisionId || null,
        allowedProvinces: allowedProvinces || [],
      });
    } catch {
      // Ignored in node runtime if localStorage is absent
    }

    // 3. Upsert user into Supabase in PENDING_ACTIVATION status
    try {
      const tokenHash = hashInvitationToken(invitation.token);

      // Create or update user with status PENDING_ACTIVATION
      const { data: userRow } = await supabase
        .from('users')
        .upsert(
          {
            email: normalizedEmail,
            name,
            phone: phone || null,
            role,
            status: 'PENDING_ACTIVATION',
            platform_branch: branch || 'DIGITAL_RACE',
            restaurant_id: tenantId || null,
            password_hash: 'PENDING_ACTIVATION_HASH', // placeholder until user activates
            is_email_verified: false,
          },
          { onConflict: 'email' }
        )
        .select('id')
        .single();

      // Insert activation token record
      await supabase.from('account_activation_tokens').insert({
        user_id: userRow?.id || null,
        email: normalizedEmail,
        name,
        token_hash: tokenHash,
        role,
        platform_branch: branch || 'DIGITAL_RACE',
        division: divisionId || null,
        allowed_provinces: allowedProvinces || [],
        restaurant_id: tenantId || null,
        is_used: false,
        expires_at: new Date(invitation.record.expiresAt).toISOString(),
      });
    } catch (dbErr) {
      console.warn('[AUTH_INVITE_CREATE] Supabase async sync notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation and activation token successfully created.',
      token: invitation.token,
      activationUrl: invitation.activationUrl,
      record: invitation.record,
    });
  } catch (err: any) {
    console.error('[AUTH_INVITE_CREATE] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to generate invitation token.' },
      { status: 500 }
    );
  }
}
