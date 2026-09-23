/**
 * ==============================================================================
 * CEYTEQ ENTERPRISE SERVER ACTIONS: TENANT MANAGEMENT
 * Target Path: /src/actions/tenantActions.ts
 * 
 * Enforces:
 * 1. Geographic Partitioning: Division Admins can ONLY register/manage restaurants
 *    in their assigned Sri Lankan provinces.
 * 2. Cross-Province Violations -> Strict 403 Forbidden with boundary details.
 * 3. Super Master Admin & Branch Master global/vertical overrides.
 * ==============================================================================
 */

'use server';

import crypto from 'crypto';
import {
  EnterpriseActorSession,
  SriLankanProvince,
  PlatformBranch,
  PROVINCE_TO_DIVISION_MAP,
  PROVINCE_NAMES,
  canActorManageProvince,
} from '@/lib/rbacMatrix';

export interface CreateTenantInput {
  name: string;
  slug: string;
  subdomain?: string;
  customDomain?: string;
  platformBranch: PlatformBranch;
  province: SriLankanProvince;
  city: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  tier?: 'FREE' | 'PLUS' | 'PRO';
  hasAiChatbot?: boolean;
  hasWhatsAppBot?: boolean;
  whatsappPhoneNumberId?: string;
  tableCount?: number;
  currency?: string;
  kitchenPin?: string;
  waiterPin?: string;
}

export interface TenantActionResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errorCode?: string;
}

// In-memory tenant store synchronized with server database
export const registeredTenantsDatabase: Map<string, any> = new Map([
  [
    'colombo-harbour',
    {
      id: 'tenant-001',
      name: 'Colombo Harbour Bistro',
      slug: 'colombo-harbour',
      subdomain: 'colombo-harbour',
      platformBranch: 'DIGITAL_RACE',
      division: 'WESTERN',
      province: 'WESTERN',
      city: 'Colombo',
      address: 'Colombo 01, Sri Lanka',
      ownerName: 'Dinesh Perera',
      ownerEmail: 'dinesh@colomboharbour.lk',
      ownerPhone: '+94777123456',
      tier: 'PRO',
      status: 'ACTIVE',
      hasAiChatbot: true,
      hasWhatsAppBot: true,
      monthlyFee: 148,
    },
  ],
  [
    'galle-fort',
    {
      id: 'tenant-002',
      name: 'Galle Fort Heritage Cafe',
      slug: 'galle-fort',
      subdomain: 'galle-fort',
      platformBranch: 'DIGITAL_RACE',
      division: 'SOUTH',
      province: 'SOUTHERN',
      city: 'Galle Fort',
      address: 'Church Street, Galle Fort, Sri Lanka',
      ownerName: 'Manuka Silva',
      ownerEmail: 'owner@gallefortcafe.com',
      ownerPhone: '+94777987654',
      tier: 'PRO',
      status: 'ACTIVE',
      hasAiChatbot: true,
      hasWhatsAppBot: false,
      monthlyFee: 129,
    },
  ],
  [
    'kandy-royal',
    {
      id: 'tenant-003',
      name: 'Kandy Royal Tea Lounge',
      slug: 'kandy-royal',
      subdomain: 'kandy-royal',
      platformBranch: 'DIGITAL_RACE',
      division: 'UP_COUNTRY',
      province: 'CENTRAL',
      city: 'Kandy',
      address: 'Peradeniya Road, Kandy, Sri Lanka',
      ownerName: 'Sunil Jayawardena',
      ownerEmail: 'sunil@kandyroyal.lk',
      ownerPhone: '+94777555123',
      tier: 'PLUS',
      status: 'ACTIVE',
      hasAiChatbot: true,
      hasWhatsAppBot: false,
      monthlyFee: 49,
    },
  ],
  [
    'jaffna-spice',
    {
      id: 'tenant-004',
      name: 'Jaffna Spice Haven',
      slug: 'jaffna-spice',
      subdomain: 'jaffna-spice',
      platformBranch: 'DIGITAL_RACE',
      division: 'NORTH',
      province: 'NORTHERN',
      city: 'Jaffna Town',
      address: 'Main Street, Jaffna, Sri Lanka',
      ownerName: 'Rajan Thamby',
      ownerEmail: 'rajan@jaffnaspice.com',
      ownerPhone: '+94777666789',
      tier: 'FREE',
      status: 'ACTIVE',
      hasAiChatbot: false,
      hasWhatsAppBot: false,
      monthlyFee: 0,
    },
  ],
]);

/**
 * Server Action: Provision a New Restaurant Tenant
 * Validates that Division Admins cannot create restaurants outside their provinces.
 */
export async function createTenantAction(
  actor: EnterpriseActorSession,
  input: CreateTenantInput
): Promise<TenantActionResult> {
  try {
    // 1. Enforce RBAC & Geographic Boundary
    const check = canActorManageProvince(actor, input.province, input.platformBranch);
    if (!check.allowed) {
      console.warn(`🛑 [GEOGRAPHIC BREACH PREVENTED] Actor ${actor.email} (${actor.role}) denied provisioning in ${input.province}: ${check.reason}`);
      return {
        success: false,
        error: check.reason || 'Geographic Partitioning Violation: You are not authorized to manage this province.',
        errorCode: 'ERR_GEOGRAPHIC_BOUNDARY_VIOLATION',
      };
    }

    // 2. Validate Required Fields
    if (!input.name || !input.slug || !input.ownerName || !input.ownerEmail || !input.province) {
      return {
        success: false,
        error: 'Mandatory fields missing: Name, slug, ownerName, ownerEmail, and province are required.',
        errorCode: 'ERR_MISSING_FIELDS',
      };
    }

    const cleanSlug = input.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    if (registeredTenantsDatabase.has(cleanSlug)) {
      return {
        success: false,
        error: `A restaurant with slug "${cleanSlug}" already exists.`,
        errorCode: 'ERR_SLUG_CONFLICT',
      };
    }

    // 3. Resolve Division from Province
    const resolvedDivision = PROVINCE_TO_DIVISION_MAP[input.province];

    // 4. Calculate Fee
    let baseMonthlyFee = 0;
    if (input.tier === 'PLUS') baseMonthlyFee = 49;
    if (input.tier === 'PRO') baseMonthlyFee = 129;
    let addOnFee = 0;
    if (input.hasWhatsAppBot) addOnFee += 19;
    if (input.hasAiChatbot && input.tier === 'FREE') addOnFee += 29;

    const newTenant = {
      id: `tenant-${Date.now()}`,
      name: input.name.trim(),
      slug: cleanSlug,
      subdomain: input.subdomain || cleanSlug,
      customDomain: input.customDomain || null,
      dnsStatus: input.customDomain ? 'PENDING' : 'NOT_CONFIGURED',
      platformBranch: input.platformBranch || 'DIGITAL_RACE',
      division: resolvedDivision,
      province: input.province,
      city: input.city || 'Colombo',
      address: input.address || `${input.city}, Sri Lanka`,
      ownerName: input.ownerName.trim(),
      ownerEmail: input.ownerEmail.toLowerCase().trim(),
      ownerPhone: input.ownerPhone.trim(),
      tier: input.tier || 'PRO',
      status: 'ACTIVE',
      monthlyFee: baseMonthlyFee + addOnFee,
      hasAiChatbot: input.hasAiChatbot ?? true,
      hasWhatsAppBot: input.hasWhatsAppBot ?? false,
      whatsappPhoneNumberId: input.whatsappPhoneNumberId || null,
      whatsappWebhookVerifyToken: input.hasWhatsAppBot
        ? `ceyteq_wa_${crypto.randomBytes(8).toString('hex')}`
        : null,
      tableCount: input.tableCount || 15,
      currency: input.currency || 'LKR',
      kitchenPin: input.kitchenPin || '2026',
      waiterPin: input.waiterPin || '1122',
      deliveryEnabled: input.tier !== 'FREE',
      paymentGatewayEnabled: input.tier !== 'FREE',
      createdAt: new Date().toISOString(),
      provisionedBy: {
        actorId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
      },
    };

    registeredTenantsDatabase.set(cleanSlug, newTenant);

    console.log(`✅ [TENANT CREATED] "${newTenant.name}" in ${newTenant.province} (${newTenant.division} Division)`);
    console.log(`   - Provisioned By: ${actor.email} [${actor.role}]`);

    return {
      success: true,
      message: `Restaurant "${newTenant.name}" registered successfully in ${PROVINCE_NAMES[newTenant.province]}.`,
      data: newTenant,
    };
  } catch (error: any) {
    console.error('❌ [CREATE TENANT ACTION ERROR]', error);
    return {
      success: false,
      error: error.message || 'Internal error creating restaurant tenant.',
      errorCode: 'ERR_INTERNAL_SERVER',
    };
  }
}

/**
 * Server Action: List Tenants accessible to the current Actor
 * Filters strictly according to Actor role & assigned provinces
 */
export async function listTenantsAction(actor: EnterpriseActorSession): Promise<TenantActionResult> {
  try {
    const allTenants = Array.from(registeredTenantsDatabase.values());

    // Super Master Admin: sees all
    if (actor.role === 'SUPER_MASTER_ADMIN') {
      return { success: true, message: 'All tenants retrieved.', data: allTenants };
    }

    // Branch Master Admins: see all within their platform vertical
    if (actor.role === 'DIGITAL_RACE_MASTER') {
      const filtered = allTenants.filter((t) => t.platformBranch === 'DIGITAL_RACE');
      return { success: true, message: 'Digital Race tenants retrieved.', data: filtered };
    }

    if (actor.role === 'TASTETRIP_MASTER') {
      const filtered = allTenants.filter((t) => t.platformBranch === 'TASTETRIP');
      return { success: true, message: 'TasteTrip tenants retrieved.', data: filtered };
    }

    // Division Admin: sees only tenants within their assigned division & provinces
    if (actor.role === 'DIVISION_ADMIN') {
      const filtered = allTenants.filter((t) => {
        const branchMatch = !actor.platformBranch || t.platformBranch === actor.platformBranch;
        const divisionMatch = t.division === actor.assignedDivision;
        const provinceMatch =
          !actor.assignedProvinces ||
          actor.assignedProvinces.length === 0 ||
          actor.assignedProvinces.includes(t.province);

        return branchMatch && divisionMatch && provinceMatch;
      });

      return {
        success: true,
        message: `Tenants for ${actor.assignedDivision} Division retrieved.`,
        data: filtered,
      };
    }

    // Tenant / Restaurant Admin: sees only their own store
    if (actor.role === 'RESTAURANT_ADMIN' && actor.tenantId) {
      const single = allTenants.filter((t) => t.id === actor.tenantId || t.slug === actor.tenantId);
      return { success: true, message: 'Tenant profile retrieved.', data: single };
    }

    return { success: false, error: 'Unauthorized role.', errorCode: 'ERR_UNAUTHORIZED' };
  } catch (error: any) {
    return { success: false, error: error.message, errorCode: 'ERR_INTERNAL_SERVER' };
  }
}
