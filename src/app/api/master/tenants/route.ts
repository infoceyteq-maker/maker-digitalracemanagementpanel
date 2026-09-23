/**
 * ==============================================================================
 * NEXT.JS API ROUTE: /api/master/tenants
 * Enterprise Multi-Tier RBAC & Geographic Partitioning Tenant Provisioning
 * ==============================================================================
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  EnterpriseActorSession,
  EnterpriseUserRole,
  SriLankanProvince,
  PlatformBranch,
  DivisionId,
  canActorManageProvince,
  PROVINCE_TO_DIVISION_MAP,
  PROVINCE_NAMES,
} from '@/lib/rbacMatrix';
import { createTenantAction } from '@/actions/tenantActions';

interface CreateTenantPayload {
  name: string;
  slug: string;
  platformBranch?: PlatformBranch;
  province?: SriLankanProvince;
  city?: string;
  division?: DivisionId;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPassword?: string;
  tier?: 'FREE' | 'PLUS' | 'PRO';
  hasAiChatbot?: boolean;
  hasWhatsAppBot?: boolean;
  whatsappPhoneNumberId?: string;
  whatsappWebhookVerifyToken?: string;
  address?: string;
  currency?: 'LKR' | 'USD' | 'EUR' | 'AED';
  tableCount?: number;
  kitchenPin?: string;
  waiterPin?: string;
  customDomain?: string;
}

export async function POST(request: Request) {
  try {
    const roleHeader = (request.headers.get('x-client-role') || 'SUPER_MASTER_ADMIN') as EnterpriseUserRole;
    const divisionHeader = request.headers.get('x-client-division') as DivisionId | undefined;
    const branchHeader = (request.headers.get('x-client-branch') || 'DIGITAL_RACE') as PlatformBranch;
    const emailHeader = request.headers.get('x-client-email') || 'info.ceyteq@gmail.com';

    // Normalize legacy role name
    const effectiveRole: EnterpriseUserRole =
      (roleHeader as any) === 'MASTER_ADMIN' ? 'SUPER_MASTER_ADMIN' : roleHeader;

    const actorSession: EnterpriseActorSession = {
      userId: 'actor-session-id',
      email: emailHeader,
      name: 'System Actor',
      role: effectiveRole,
      platformBranch: branchHeader,
      assignedDivision: divisionHeader,
    };

    const payload: CreateTenantPayload = await request.json();

    const targetProvince: SriLankanProvince = payload.province || 'WESTERN';
    const targetBranch: PlatformBranch = payload.platformBranch || 'DIGITAL_RACE';

    // Geographic boundary check
    const check = canActorManageProvince(actorSession, targetProvince, targetBranch);
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          code: 'ERR_GEOGRAPHIC_BOUNDARY_VIOLATION',
          message: check.reason || 'Geographic partition violation.',
        },
        { status: 403 }
      );
    }

    // Call server action
    const actionResult = await createTenantAction(actorSession, {
      name: payload.name,
      slug: payload.slug,
      platformBranch: targetBranch,
      province: targetProvince,
      city: payload.city || 'Colombo',
      address: payload.address || `${payload.city || 'Colombo'}, Sri Lanka`,
      ownerName: payload.ownerName,
      ownerEmail: payload.ownerEmail,
      ownerPhone: payload.ownerPhone || '+94770000000',
      tier: payload.tier || 'PRO',
      hasAiChatbot: payload.hasAiChatbot ?? true,
      hasWhatsAppBot: payload.hasWhatsAppBot ?? false,
      whatsappPhoneNumberId: payload.whatsappPhoneNumberId,
      customDomain: payload.customDomain,
      tableCount: payload.tableCount || 15,
      currency: payload.currency || 'LKR',
      kitchenPin: payload.kitchenPin || '2026',
      waiterPin: payload.waiterPin || '1122',
    });

    if (!actionResult.success) {
      return NextResponse.json(
        {
          error: actionResult.errorCode || 'BAD_REQUEST',
          message: actionResult.error,
        },
        { status: actionResult.errorCode === 'ERR_GEOGRAPHIC_BOUNDARY_VIOLATION' ? 403 : 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: actionResult.message,
        tenant: actionResult.data,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
