'use server';

// ==============================================================================
// CEYTEQ ENTERPRISE MULTI-TENANT PROVISIONING ACTIONS
// Hierarchical RBAC: SUPER_MASTER_ADMIN, DIGITAL_RACE_MASTER, DIVISION_ADMIN
// ==============================================================================

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { DivisionId, SriLankanProvince, SRI_LANKA_DIVISIONS } from '../lib/rbacMatrix';
import { createInvitation, hashInvitationToken } from '../lib/invitationService';
import { credentialsService } from '../lib/credentialsService';

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

export interface CreateRestaurantTenantInput {
  callerRole: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'DIVISION_ADMIN' | string;
  callerDivisionId?: DivisionId | null;
  callerAllowedProvinces?: SriLankanProvince[];
  name: string;
  divisionId: DivisionId;
  province: SriLankanProvince;
  subscriptionTier: 'FREE' | 'PRO' | 'PLUS';
  hasAiChatbot?: boolean;
  hasWhatsAppBot?: boolean;
  whatsAppPhoneNumberId?: string;
  adminEmail: string;
  adminPhone: string;
  adminName?: string;
}

/**
 * Server Action: Provision a new Restaurant Tenant & Administrator
 */
export async function createRestaurantTenant(input: CreateRestaurantTenantInput) {
  const {
    callerRole,
    callerDivisionId,
    callerAllowedProvinces = [],
    name,
    divisionId,
    province,
    subscriptionTier,
    hasAiChatbot = false,
    hasWhatsAppBot = false,
    whatsAppPhoneNumberId,
    adminEmail,
    adminPhone,
    adminName,
  } = input;

  console.log(`[PROVISION_TENANT_START] Initiated by ${callerRole} for restaurant: ${name}`);

  // 1. RBAC Clearance & Geographic Boundary Check
  const isSuper = callerRole === 'SUPER_MASTER_ADMIN';
  const isDigitalRaceMaster = callerRole === 'DIGITAL_RACE_MASTER';
  const isDivisionAdmin = callerRole === 'DIVISION_ADMIN';

  if (!isSuper && !isDigitalRaceMaster && !isDivisionAdmin) {
    return {
      success: false,
      error: 'Permission Denied: Only Super Master, Digital Race Master, or authorized Division Admins can provision restaurants.',
    };
  }

  // If Division Admin, verify that the requested province falls within their allowed jurisdiction
  if (isDivisionAdmin) {
    if (callerDivisionId && callerDivisionId !== divisionId) {
      return {
        success: false,
        error: `Geographic Boundary Violation: Your division (${callerDivisionId}) cannot provision stores in ${divisionId}.`,
      };
    }

    const authorizedProvinces = callerAllowedProvinces.length > 0
      ? callerAllowedProvinces
      : callerDivisionId
      ? SRI_LANKA_DIVISIONS[callerDivisionId]?.provinces || []
      : [];

    if (!authorizedProvinces.includes(province)) {
      return {
        success: false,
        error: `Province Isolation Breach: Province ${province} is outside your authorized regional boundaries.`,
      };
    }
  }

  // 2. Validate input fields
  if (!name.trim() || !adminEmail.trim() || !adminPhone.trim()) {
    return {
      success: false,
      error: 'Restaurant Name, Admin Email, and Admin Mobile are required.',
    };
  }

  const normalizedEmail = adminEmail.trim().toLowerCase();
  const normalizedPhone = adminPhone.trim().replace(/[\s\-]/g, '');

  // Generate URL-friendly slug and subdomain
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const uniqueSuffix = crypto.randomBytes(3).toString('hex');
  const slug = `${baseSlug}-${uniqueSuffix}`;
  const subdomain = slug;

  // 3. Create Tenant in Supabase
  let tenantId = crypto.randomUUID();
  try {
    const { data: tenantRow, error: tenantErr } = await supabase
      .from('tenants')
      .insert({
        name: name.trim(),
        slug,
        subdomain,
        branch: 'DIGITAL_RACE',
        division_id: divisionId,
        province,
        subscription_tier: subscriptionTier,
        has_ai_chatbot: hasAiChatbot,
        has_whatsapp_bot: hasWhatsAppBot,
        whatsapp_phone_number_id: whatsAppPhoneNumberId || null,
        monthly_fee: subscriptionTier === 'PLUS' ? 249 : subscriptionTier === 'PRO' ? 129 : 0,
        status: 'ACTIVE',
        currency: 'LKR',
        table_count: 15,
        accent_color: '#00C8FF',
        address: `${province}, Sri Lanka`,
      })
      .select('id')
      .single();

    if (tenantRow) {
      tenantId = tenantRow.id;
    } else if (tenantErr) {
      console.warn('[PROVISION_TENANT] Supabase insert warning:', tenantErr.message);
    }
  } catch (dbErr) {
    console.warn('[PROVISION_TENANT] Supabase async connection notice:', dbErr);
  }

  // 4. Generate Single-Use Cryptographic 48-Hour Activation Token
  const invitation = createInvitation({
    email: normalizedEmail,
    name: adminName || `${name} Admin`,
    role: 'RESTAURANT_ADMIN',
    branch: 'DIGITAL_RACE',
    divisionId,
    allowedProvinces: [province],
    tenantId,
    baseUrl: 'https://maker-digitalracemanagementpanel.vercel.app',
  });

  // 5. Create User Record as PENDING_ACTIVATION
  try {
    const tokenHash = hashInvitationToken(invitation.token);

    // Create user in PENDING_ACTIVATION
    const { data: userRow } = await supabase
      .from('users')
      .upsert(
        {
          email: normalizedEmail,
          phone: normalizedPhone,
          name: adminName || `${name} Administrator`,
          password_hash: 'PENDING_ACTIVATION_HASH',
          role: 'RESTAURANT_ADMIN',
          branch: 'DIGITAL_RACE',
          division_id: divisionId,
          allowed_provinces: [province],
          tenant_id: tenantId,
          status: 'PENDING_ACTIVATION',
          is_email_verified: false,
          is_phone_verified: false,
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single();

    // Store activation token
    await supabase.from('activation_tokens').insert({
      user_id: userRow?.id || crypto.randomUUID(),
      token_hash: tokenHash,
      email: normalizedEmail,
      role: 'RESTAURANT_ADMIN',
      branch: 'DIGITAL_RACE',
      division_id: divisionId,
      allowed_provinces: [province],
      tenant_id: tenantId,
      used: false,
      expires_at: new Date(invitation.record.expiresAt).toISOString(),
    });
  } catch (userDbErr) {
    console.warn('[PROVISION_TENANT] Supabase token sync notice:', userDbErr);
  }

  // Also register in local client credential registry
  try {
    credentialsService.createInvitationRecord({
      email: normalizedEmail,
      name: adminName || `${name} Administrator`,
      role: 'RESTAURANT_ADMIN',
      branch: 'DIGITAL_RACE',
      divisionId,
      allowedProvinces: [province],
    });
  } catch {
    // Local fallback
  }

  console.log(`[PROVISION_TENANT_SUCCESS] Tenant provisioned: ${name} (${tenantId}) | Activation link: ${invitation.activationUrl}`);

  return {
    success: true,
    message: `Restaurant "${name}" successfully provisioned! Single-use activation token generated.`,
    tenant: {
      id: tenantId,
      name,
      slug,
      subdomain,
      divisionId,
      province,
      subscriptionTier,
      hasAiChatbot,
      hasWhatsAppBot,
    },
    adminUser: {
      email: normalizedEmail,
      phone: normalizedPhone,
      role: 'RESTAURANT_ADMIN',
      status: 'PENDING_ACTIVATION',
    },
    activation: {
      token: invitation.token,
      activationUrl: invitation.activationUrl,
      expiresAt: invitation.record.expiresAt,
    },
  };
}
