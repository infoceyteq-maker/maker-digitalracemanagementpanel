import { NextResponse } from 'next/server';
import { initiateDualOtpReset } from '@/src/lib/dualOtpService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phoneNumber } = body;

    if (!email || !phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Both registered corporate email and phone number are required.' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const result = await initiateDualOtpReset(email, phoneNumber, ip);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[RESET_REQUEST_ERROR]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to dispatch verification codes.' },
      { status: 400 }
    );
  }
}
