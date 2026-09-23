import { NextRequest, NextResponse } from 'next/server';
import { createInvitation } from '@/lib/invitationService';
import { credentialsService } from '@/lib/credentialsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, branch, divisionId, allowedProvinces, tenantId } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    // Determine base URL from request or fallback to production
    const origin = request.nextUrl.origin || 'https://maker-digitalracemanagementpanel.vercel.app';

    const invitation = createInvitation({
      email,
      name,
      role,
      branch: branch || 'DIGITAL_RACE',
      divisionId: divisionId || null,
      allowedProvinces: allowedProvinces || [],
      tenantId: tenantId || null,
      baseUrl: origin,
    });

    // Optionally update admin status in credentials service to PENDING
    if (role === 'DIVISION_ADMIN' || role === 'DIGITAL_RACE_MASTER' || role === 'TASTETRIP_MASTER') {
      const existing = credentialsService.getEnterpriseAdmins().find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        credentialsService.upsertEnterpriseAdmin({
          ...existing,
          status: 'PENDING',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation link generated successfully',
      activationUrl: invitation.activationUrl,
      token: invitation.token,
      expiresAt: invitation.record.expiresAt,
      record: invitation.record,
    });
  } catch (error: any) {
    console.error('[INVITATION_GENERATE_ERROR]', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Failed to generate invitation' },
      { status: 500 }
    );
  }
}
