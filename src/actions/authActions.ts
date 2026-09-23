'use server';

// ==============================================================================
// CEYTEQ ENTERPRISE AUTHENTICATION & PASSWORD RECOVERY SERVER ACTIONS
// Multi-Channel Identity Verification (Resend Email OTP + Meta WhatsApp Cloud OTP)
// ==============================================================================

import { initiateDualOtpReset, verifyDualOtpAndResetPassword } from '../lib/dualOtpService';

/**
 * Server Action: Initiate Password Reset (Dual-OTP Email + WhatsApp)
 */
export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string) || '';
  const phoneNumber = (formData.get('phoneNumber') as string) || '';

  if (!email || !phoneNumber) {
    return {
      success: false,
      error: 'Please provide both your registered corporate email and WhatsApp phone number.',
    };
  }

  try {
    const result = await initiateDualOtpReset(email, phoneNumber, '127.0.0.1');
    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to dispatch dual verification codes.',
    };
  }
}

/**
 * Server Action: Verify Dual OTPs and establish permanent bcrypt password
 */
export async function verifyAndResetPassword(formData: FormData) {
  const email = (formData.get('email') as string) || '';
  const phoneNumber = (formData.get('phoneNumber') as string) || '';
  const emailOtp = (formData.get('emailOtp') as string) || '';
  const phoneOtp = (formData.get('phoneOtp') as string) || '';
  const newPassword = (formData.get('newPassword') as string) || '';

  if (!email || !phoneNumber || !emailOtp || !phoneOtp || !newPassword) {
    return {
      success: false,
      error: 'All fields (Email, Phone, Email OTP, WhatsApp OTP, and New Password) are mandatory.',
    };
  }

  try {
    const result = await verifyDualOtpAndResetPassword(
      email,
      phoneNumber,
      emailOtp,
      phoneOtp,
      newPassword
    );
    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Password reset verification failed.',
    };
  }
}
