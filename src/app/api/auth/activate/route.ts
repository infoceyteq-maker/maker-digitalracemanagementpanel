import { NextRequest, NextResponse } from 'next/server';
import { verifyInvitationToken, consumeInvitationAndSetPassword } from '@/lib/invitationService';
import { credentialsService } from '@/lib/credentialsService';

/**
 * GET: Validates whether the activation token is active, valid, and not expired
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { isValid: false, error: 'MISSING_PARAMETERS', message: 'Token and email are required.' },
        { status: 400 }
      );
    }

    const result = verifyInvitationToken(token, email);

    if (!result.isValid || !result.record) {
      return NextResponse.json(
        {
          isValid: false,
          error: result.error || 'INVALID_TOKEN',
          message:
            result.error === 'TOKEN_EXPIRED'
              ? 'This invitation link has expired (24-hour limit). Please request a new link.'
              : result.error === 'TOKEN_ALREADY_USED'
              ? 'This invitation link has already been used. Please log in directly.'
              : 'Invalid invitation link or security signature.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      isValid: true,
      email: result.record.email,
      name: result.record.name,
      role: result.record.role,
      branch: result.record.branch,
      divisionId: result.record.divisionId,
      allowedProvinces: result.record.allowedProvinces,
      tenantId: result.record.tenantId,
    });
  } catch (error: any) {
    console.error('[ACTIVATION_VALIDATE_ERROR]', error);
    return NextResponse.json(
      { isValid: false, error: 'SERVER_ERROR', message: error?.message || 'Token verification failed.' },
      { status: 500 }
    );
  }
}

/**
 * POST: Consumes token, hashes permanent password with bcrypt 12 salt rounds, and activates account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'MISSING_DATA', message: 'Token, email, and permanent password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const result = await consumeInvitationAndSetPassword(token, email, password);

    if (!result.success || !result.record) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message:
            result.error === 'TOKEN_EXPIRED'
              ? 'Your activation token has expired. Please contact your Super Master Admin for a new link.'
              : 'Failed to activate account. The invitation link may have already been used.',
        },
        { status: 400 }
      );
    }

    // Update the in-memory/persistent credentialsService so that subsequent logins succeed
    const normalizedEmail = email.trim().toLowerCase();
    const allAdmins = credentialsService.getEnterpriseAdmins();
    const adminIndex = allAdmins.findIndex((a) => a.email.toLowerCase() === normalizedEmail);

    if (adminIndex !== -1) {
      const existing = allAdmins[adminIndex];
      credentialsService.upsertEnterpriseAdmin({
        ...existing,
        password: password, // credentialsService also maintains cleartext/hash for the dashboard UI
        status: 'ACTIVE',
      });
    }

    // Also check if restaurant owner
    const sysCreds = credentialsService.getCredentials();
    for (const [tenantId, tCred] of Object.entries(sysCreds.tenantPasswords)) {
      if (tCred.ownerEmail.toLowerCase() === normalizedEmail) {
        credentialsService.setTenantPassword(tenantId, tCred.ownerEmail, password);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account successfully activated! Permanent password set.',
      redirectUrl: result.redirectUrl,
      user: {
        email: result.record.email,
        name: result.record.name,
        role: result.record.role,
        branch: result.record.branch,
        divisionId: result.record.divisionId,
        tenantId: result.record.tenantId,
      },
    });
  } catch (error: any) {
    console.error('[ACTIVATION_CONSUME_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message || 'Account activation failed.' },
      { status: 500 }
    );
  }
}
