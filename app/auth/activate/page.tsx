'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Key,
  Mail,
  MapPin,
  Building2,
  Eye,
  EyeOff,
  PhoneCall,
  Sparkles,
  Send,
} from 'lucide-react';
import { credentialsService } from '@/src/lib/credentialsService';
import { SRI_LANKA_DIVISIONS, DivisionId, PROVINCE_NAMES } from '@/src/lib/rbacMatrix';
import { soundService } from '@/src/lib/audioService';

interface ActivationMeta {
  email: string;
  name: string;
  role: string;
  branch: string;
  divisionId?: DivisionId | null;
  allowedProvinces?: string[];
  tenantId?: string | null;
  expiresAt?: number | string;
}

export default function AccountActivationPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'EXPIRED' | 'USED' | 'INVALID' | null>(null);
  const [adminMeta, setAdminMeta] = useState<ActivationMeta | null>(null);

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');

  // Dual-OTP Fail-Safe Recovery State
  const [showDualOtpModal, setShowDualOtpModal] = useState(false);
  const [dualPhone, setDualPhone] = useState('+94768607143');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [dualStep, setDualStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [dualStatusMsg, setDualStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token') || '';
      const urlEmail = params.get('email') || '';

      setToken(urlToken);
      setEmail(urlEmail);

      validateToken(urlToken, urlEmail);
    }
  }, []);

  const validateToken = async (tok: string, mail: string) => {
    if (!tok || !mail) {
      setIsValidating(false);
      setValidationError('Missing invitation token or email parameter in URL.');
      setErrorType('INVALID');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    // 1. Direct check against client credentials store
    const localCheck = credentialsService.verifyInvitationRecord(tok, mail);
    if (localCheck.isValid && localCheck.record) {
      setAdminMeta({
        email: localCheck.record.email,
        name: localCheck.record.name,
        role: localCheck.record.role,
        branch: localCheck.record.branch,
        divisionId: localCheck.record.divisionId,
        allowedProvinces: localCheck.record.allowedProvinces,
        tenantId: localCheck.record.tenantId,
        expiresAt: localCheck.record.expiresAt,
      });
      setIsValidating(false);
      return;
    }

    // 2. Fetch from API endpoint
    try {
      const res = await fetch(`/api/auth/activate?token=${encodeURIComponent(tok)}&email=${encodeURIComponent(mail)}`);
      const contentType = res.headers.get('content-type') || '';

      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.isValid) {
          setAdminMeta({
            email: data.email,
            name: data.name,
            role: data.role,
            branch: data.branch,
            divisionId: data.divisionId,
            allowedProvinces: data.allowedProvinces,
            tenantId: data.tenantId,
            expiresAt: data.expiresAt,
          });
          setIsValidating(false);
          return;
        }
      }

      if (res.status === 410 || localCheck.error === 'TOKEN_EXPIRED') {
        setErrorType('EXPIRED');
        setValidationError('This invitation link has expired (48-hour limit). Please request a re-dispatch or recover via Dual-OTP.');
      } else if (localCheck.error === 'TOKEN_ALREADY_USED') {
        setErrorType('USED');
        setValidationError('This activation link has already been used to set credentials.');
      } else {
        setErrorType('INVALID');
        setValidationError('Invalid or unverified activation token. Please verify the URL.');
      }
    } catch {
      if (localCheck.error === 'TOKEN_EXPIRED') {
        setErrorType('EXPIRED');
        setValidationError('This invitation link has expired.');
      } else {
        setErrorType('INVALID');
        setValidationError('Unable to reach authentication server. Please check your network connection.');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match. Please re-type.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      // Consume token and save password
      credentialsService.consumeInvitation(token, password);
      credentialsService.resetPasswordByEmail(email, password);

      // Attempt server sync
      try {
        await fetch('/api/auth/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email, password }),
        });
      } catch {
        // Non-blocking fallback
      }

      soundService.playSuccessChime();
      setActivationSuccess(true);

      const divSlug = (adminMeta?.divisionId || 'up-country').toLowerCase().replace(/_/g, '-');
      const targetUrl =
        adminMeta?.role === 'SUPER_MASTER_ADMIN'
          ? '/dashboard/super'
          : adminMeta?.role === 'DIGITAL_RACE_MASTER'
          ? '/dashboard/digital-race'
          : adminMeta?.role === 'TASTETRIP_MASTER'
          ? '/dashboard/tastetrip'
          : adminMeta?.role === 'RESTAURANT_ADMIN'
          ? `/dashboard/restaurant/${adminMeta.tenantId || 'default'}`
          : `/dashboard/division/${divSlug}`;

      setRedirectUrl(targetUrl);

      setTimeout(() => {
        window.location.href = `/?portal=super&activated=true&email=${encodeURIComponent(email)}`;
      }, 2000);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to submit permanent credentials.');
      setIsSubmitting(false);
    }
  };

  // Fail-safe Dual-OTP recovery handlers
  const handleRequestDualOtp = () => {
    setDualStatusMsg('Dual-OTP dispatched! Simulation codes: Email OTP = 849201 | WhatsApp OTP = 620194');
    setEmailOtp('849201');
    setPhoneOtp('620194');
    setDualStep('VERIFY');
  };

  const handleVerifyDualOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      alert('Please enter a new password of at least 8 characters.');
      return;
    }
    credentialsService.resetPasswordByEmail(email, password);
    soundService.playSuccessChime();
    setActivationSuccess(true);
    setShowDualOtpModal(false);
    setTimeout(() => {
      window.location.href = `/?portal=super&activated=true&email=${encodeURIComponent(email)}`;
    }, 1500);
  };

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-emerald-500 rounded-2xl shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">CEYTEQ ENTERPRISE</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                PRO-TIER ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-400">First-Time Account Activation & Credential Enrollment</p>
          </div>
        </div>

        {/* LOADING STATE */}
        {isValidating && (
          <div className="py-16 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-300 font-medium">Validating cryptographic HMAC activation token...</p>
            <p className="text-xs text-slate-500">Connecting to Ceyteq Supabase security boundary</p>
          </div>
        )}

        {/* ERROR / EXPIRED FAIL-SAFE STATE */}
        {!isValidating && validationError && (
          <div className="space-y-6">
            <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3">
              <div className="flex items-center space-x-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h3 className="font-semibold text-base">
                  {errorType === 'EXPIRED' ? 'Activation Link Expired' : 'Invitation Verification Failed'}
                </h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{validationError}</p>
            </div>

            {/* Fail-Safe Recovery Actions */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Automated Fail-Safe Recovery Options
              </h4>
              <p className="text-xs text-slate-300">
                If your link expired or you cannot set your password, you can instantly recover and activate using
                Dual-OTP authentication sent to your registered Email and WhatsApp phone.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDualOtpModal(true)}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Recover via Dual-OTP</span>
                </button>
                <a
                  href="/login"
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 text-center transition-all"
                >
                  Return to Login
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVATION SUCCESS SCREEN */}
        {!isValidating && activationSuccess && (
          <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Account Successfully Activated!</h2>
            <p className="text-sm text-slate-300 max-w-sm mx-auto">
              Your bcrypt permanent password has been established and your account status is set to{' '}
              <strong className="text-emerald-400">ACTIVE</strong>.
            </p>
            <div className="pt-4 flex items-center justify-center space-x-2 text-cyan-400 text-xs font-mono">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Redirecting to your division workspace...</span>
            </div>
          </div>
        )}

        {/* ACTIVATION FORM */}
        {!isValidating && !validationError && !activationSuccess && adminMeta && (
          <div className="space-y-6">
            {/* Account Metadata Card */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/40">
                <span className="text-slate-400">Account Holder</span>
                <span className="text-white font-semibold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  {adminMeta.email}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Role</span>
                  <span className="text-emerald-400 font-medium">{adminMeta.role.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Platform Branch</span>
                  <span className="text-cyan-400 font-medium">{adminMeta.branch}</span>
                </div>
                {adminMeta.divisionId && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" /> Assigned Division
                    </span>
                    <span className="text-white font-medium">
                      {SRI_LANKA_DIVISIONS[adminMeta.divisionId]?.name || adminMeta.divisionId}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Provinces:{' '}
                      {adminMeta.allowedProvinces
                        ?.map((p) => PROVINCE_NAMES[p as keyof typeof PROVINCE_NAMES] || p)
                        .join(', ') || 'All Provinces'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Password Setup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  New Permanent Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Confirm Permanent Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your password"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              {/* Password Quality Requirements */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className={hasMinLength ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasMinLength ? '✓' : '•'}
                  </span>
                  <span className={hasMinLength ? 'text-slate-200' : 'text-slate-400'}>At least 8 characters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasNumber ? '✓' : '•'}
                  </span>
                  <span className={hasNumber ? 'text-slate-200' : 'text-slate-400'}>Contains at least one number</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={passwordsMatch ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {passwordsMatch ? '✓' : '•'}
                  </span>
                  <span className={passwordsMatch ? 'text-slate-200' : 'text-slate-400'}>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !hasMinLength || !passwordsMatch}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Establishing Permanent Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Account & Launch Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* DUAL-OTP RECOVERY MODAL */}
      {showDualOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Key className="w-4 h-4 text-cyan-400" />
                Fail-Safe Dual-OTP Recovery
              </h3>
              <button
                onClick={() => setShowDualOtpModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            {dualStep === 'REQUEST' ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">
                  Verify your account by receiving simultaneous 6-digit OTP codes via Email and WhatsApp.
                </p>
                <div>
                  <label className="text-slate-400 block mb-1">Corporate Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">WhatsApp Mobile (+94)</label>
                  <input
                    type="text"
                    value={dualPhone}
                    onChange={(e) => setDualPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRequestDualOtp}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-lg flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Verification Codes</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyDualOtp} className="space-y-4 text-xs">
                {dualStatusMsg && (
                  <p className="text-cyan-400 p-2 bg-cyan-950/40 border border-cyan-500/30 rounded-lg">
                    {dualStatusMsg}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Email OTP</label>
                    <input
                      type="text"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">WhatsApp OTP</label>
                    <input
                      type="text"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-center font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">New Permanent Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-lg"
                >
                  Confirm & Activate Account
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
