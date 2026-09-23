import { NextResponse } from 'next/server';
import { verifyDualOtpAndResetPassword } from '@/src/lib/dualOtpService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phoneNumber, emailOtp, phoneOtp, newPassword } = body;

    if (!email || !phoneNumber || !emailOtp || !phoneOtp || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'All fields (Email, Mobile, Email OTP, WhatsApp OTP, and New Password) are required.' },
        { status: 400 }
      );
    }

    const result = await verifyDualOtpAndResetPassword(
      email,
      phoneNumber,
      emailOtp,
      phoneOtp,
      newPassword
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[RESET_VERIFY_ERROR]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Verification failed.' },
      { status: 400 }
    );
  }
}
