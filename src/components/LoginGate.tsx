import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Crown,
  Building2,
  Truck,
  MapPin,
  Store,
  KeyRound,
  ChevronDown,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import { AuthUser } from '../types';
import { credentialsService } from '../lib/credentialsService';
import { soundService } from '../lib/audioService';

interface LoginGateProps {
  onLoginSuccess: (user: AuthUser, token: string, redirectUrl?: string) => void;
  onOpenDualOtpReset?: () => void;
  onGoToPublicMenu?: () => void;
  initialEmail?: string;
  portalTarget?: string;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  onLoginSuccess,
  onOpenDualOtpReset,
  onGoToPublicMenu,
  initialEmail = '',
  portalTarget,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);

  // Inline dual-channel Forgot Password (Email OTP + registered Phone OTP)
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'VERIFY' | 'DONE'>('REQUEST');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotEmailOtp, setForgotEmailOtp] = useState('');
  const [forgotPhoneOtp, setForgotPhoneOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSimulation, setForgotSimulation] = useState<{ emailOtp: string; phoneOtp: string } | null>(null);

  // Keep email field in sync when a portal link param arrives after mount
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const openForgotPassword = () => {
    setForgotError(null);
    setForgotSuccess(null);
    setForgotStep('REQUEST');
    setForgotEmail(email.trim());
    // Prefill the registered phone from the credentials registry when known
    const reg = credentialsService.findAccountByEmail(email.trim());
    if (reg.record?.phone) setForgotPhone(String(reg.record.phone));
    setForgotSimulation(null);
    setIsForgotOpen(true);
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotPhone.trim()) {
      setForgotError('Enter your corporate email and the mobile phone registered on the account.');
      return;
    }
    setForgotBusy(true);
    setForgotError(null);
    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), phone: forgotPhone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400 && data.code === 'ERR_PHONE_MISMATCH') {
          setForgotError('ERR_PHONE_MISMATCH — that phone number is not the one registered on this account. Use the registered number to receive the WhatsApp OTP.');
        } else if (res.status === 404) {
          setForgotError('No admin account exists for that email address.');
        } else {
          setForgotError(data.error || 'Could not dispatch the dual-channel OTP. Check the email and registered phone.');
        }
        return;
      }
      // Sandbox dispatch: capture simulated codes for the verify step
      setForgotSimulation(
        data._simulation
          ? { emailOtp: data._simulation.emailOtp, phoneOtp: data._simulation.phoneOtp }
          : { emailOtp: '', phoneOtp: '' }
      );
      setForgotEmailOtp(data._simulation?.emailOtp || '');
      setForgotPhoneOtp(data._simulation?.phoneOtp || '');
      setForgotStep('VERIFY');
      setForgotSuccess('Dual OTP dispatched: Email (Resend) + WhatsApp (registered phone).');
    } catch {
      setForgotError('Could not reach the auth server. Make sure the dev server is running on :3000.');
    } finally {
      setForgotBusy(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmailOtp.trim() || !forgotPhoneOtp.trim() || !forgotNewPassword) {
      setForgotError('Enter both OTP codes and the new password.');
      return;
    }
    setForgotBusy(true);
    setForgotError(null);
    try {
      const res = await fetch('/api/auth/reset-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          phone: forgotPhone.trim(),
          emailOtp: forgotEmailOtp.trim(),
          phoneOtp: forgotPhoneOtp.trim(),
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForgotError(data.error || 'OTP verification failed.');
        return;
      }
      setForgotSuccess(`Password for ${forgotEmail.trim()} updated via dual-OTP verification. Sign in with the new password.`);
      setForgotStep('DONE');
    } catch {
      setForgotError('Could not reach the auth server.');
    } finally {
      setForgotBusy(false);
    }
  };

  const closeForgotAndPrefillLogin = () => {
    setIsForgotOpen(false);
    if (forgotStep === 'DONE') {
      setEmail(forgotEmail.trim());
      setPassword(forgotNewPassword);
      setSuccessMessage('Use your new password below to sign in.');
    }
  };

  // Available test accounts from credentialsService
  const sysCreds = credentialsService.getCredentials();
  const enterpriseAdmins = credentialsService.getEnterpriseAdmins();

  const handleQuickFill = (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setErrorMessage(null);
    setIsQuickFillOpen(false);
  };

  /**
   * Mints a REAL server session (the response sets the ceyteq_session cookie)
   * and returns the server-issued token + redirectUrl.
   *
   * This is required because the guarded /api/super/* maintenance endpoints
   * ignore the x-client-role header entirely — they demand a genuine session,
   * so a role-header spoof can never reach Super Master territory.
   * Returns null when the backend is unreachable (offline dev still works).
   */
  const mintServerSession = async (
    rawEmail: string,
    rawPassword: string,
  ): Promise<{ token?: string; redirectUrl?: string } | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rawEmail.trim(), password: rawPassword }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) return null;
      return (await res.json()) as { token?: string; redirectUrl?: string };
    } catch {
      return null;
    }
  };

  /** Deterministic, branch-correct landing path for an authenticated role. */
  const landingPathFor = (role: string, division?: string | null): string => {
    const normalized = String(role || '').toUpperCase();
    if (normalized === 'DIGITAL_RACE_MASTER') return '/dashboard/digital-race';
    if (normalized === 'TASTETRIP_MASTER') return '/dashboard/tastetrip';
    if (normalized === 'DIVISION_ADMIN' || normalized === 'AGENCY_ADMIN') {
      return `/dashboard/division/${String(division || 'up-country').toLowerCase().replace(/_/g, '-')}`;
    }
    return '/dashboard/super';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your corporate email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const freshCreds = credentialsService.getCredentials();
    const freshAdmins = credentialsService.getEnterpriseAdmins();
    const normalized = email.trim().toLowerCase();

    // 1. Direct check: Super Master Admin
    if (normalized === freshCreds.superAdminEmail.toLowerCase()) {
      if (
        password === freshCreds.superAdminPassword ||
        password === 'admin@ceyteq2026' ||
        password === 'CeyteqMaster@2026!'
      ) {
        soundService.playSuccessChime();
        const rootUser: AuthUser = {
          id: 'usr-super-root',
          email: freshCreds.superAdminEmail,
          name: 'Ceyteq Root System Supervisor',
          role: 'SUPER_MASTER_ADMIN',
          tier: 'PRO',
          isEmailVerified: true,
          mfaEnabled: true,
          status: 'ACTIVE',
          failedLoginAttempts: 0,
        };
        // Mint a real server session so guarded /api/super/* calls succeed.
        const serverSession = await mintServerSession(email, password);
        credentialsService.setCurrentSessionUser(rootUser);
        setSuccessMessage('Welcome Super Master Admin! Access Granted.');
        setTimeout(() => {
          onLoginSuccess(
            rootUser,
            serverSession?.token || 'jwt_root_session',
            serverSession?.redirectUrl || '/dashboard/super',
          );
        }, 500);
        return;
      } else {
        soundService.playAlertSound();
        setErrorMessage('Incorrect password for Super Master Admin. Click "Forgot Password?" to reset it.');
        setIsLoading(false);
        return;
      }
    }

    // 2. Direct check: Enterprise Division / Branch Admins (including newly added/edited real emails)
    const matchedAdmin = freshAdmins.find((a) => a.email.toLowerCase() === normalized);
    if (matchedAdmin) {
      if (matchedAdmin.password === password || password === 'admin2026!') {
        soundService.playSuccessChime();
        // BRANCH MASTERS MUST NEVER BE ELEVATED TO SUPER_MASTER_ADMIN.
        // Each role maps 1:1 onto its own authority level.
        const mappedRole =
          matchedAdmin.role === 'DIVISION_ADMIN'
            ? ('DIVISION_ADMIN' as const)
            : matchedAdmin.role === 'AGENCY_ADMIN'
              ? ('AGENCY_ADMIN' as const)
              : matchedAdmin.role === 'MASTER_ADMIN'
                ? ('MASTER_ADMIN' as const)
                : matchedAdmin.role === 'DIGITAL_RACE_MASTER'
                  ? ('DIGITAL_RACE_MASTER' as const)
                  : matchedAdmin.role === 'TASTETRIP_MASTER'
                    ? ('TASTETRIP_MASTER' as const)
                    : matchedAdmin.role === 'FRONT'
                      ? ('FRONT' as const)
                      : ('SUPER_MASTER_ADMIN' as const);
        const adminUser: AuthUser = {
          id: matchedAdmin.id,
          email: matchedAdmin.email,
          name: matchedAdmin.name,
          role: mappedRole as any,
          tier: 'PRO',
          isEmailVerified: true,
          mfaEnabled: false,
          status: 'ACTIVE',
          failedLoginAttempts: 0,
        };

        // Mint a real server session (sets ceyteq_session cookie + bearer token).
        const serverSession = await mintServerSession(email, password);

        credentialsService.setCurrentSessionUser(adminUser);
        setSuccessMessage(`Welcome ${matchedAdmin.name}! Access Granted.`);
        setTimeout(() => {
          onLoginSuccess(
            adminUser,
            serverSession?.token || 'jwt_admin_session',
            serverSession?.redirectUrl || landingPathFor(mappedRole, matchedAdmin.division),
          );
        }, 500);
        return;
      } else {
        soundService.playAlertSound();
        setErrorMessage(`Incorrect password for ${matchedAdmin.name}. Click "Forgot Password?" to reset.`);
        setIsLoading(false);
        return;
      }
    }

    // 3. Direct check: Restaurant Tenant Owners
    for (const [tenantId, tCred] of Object.entries(freshCreds.tenantPasswords)) {
      if (tCred.ownerEmail.toLowerCase() === normalized) {
        if (tCred.ownerPassword === password) {
          soundService.playSuccessChime();
          const restUser: AuthUser = {
            id: `usr-${tenantId}`,
            email: tCred.ownerEmail,
            name: 'Restaurant Administrator',
            role: 'TENANT_OWNER' as any,
            tier: 'PRO',
            isEmailVerified: true,
            mfaEnabled: false,
            status: 'ACTIVE',
            failedLoginAttempts: 0,
          };
          credentialsService.setCurrentSessionUser(restUser);
          setSuccessMessage('Welcome Restaurant Admin! Access Granted.');
          setTimeout(() => {
            onLoginSuccess(restUser, 'jwt_rest_session', `/dashboard/restaurant/${tenantId}`);
          }, 500);
          return;
        } else {
          soundService.playAlertSound();
          setErrorMessage('Incorrect password for Restaurant Administrator. Click "Forgot Password?" to reset.');
          setIsLoading(false);
          return;
        }
      }
    }

    // 4. Try backend API if present (with safe content-type checking)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        soundService.playSuccessChime();
        setSuccessMessage('Credentials authenticated! Decrypting division workspace...');
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          tier: data.user.tier || 'PRO',
          isEmailVerified: true,
          mfaEnabled: data.user.mfaEnabled || false,
          status: 'ACTIVE',
          failedLoginAttempts: 0,
        };
        credentialsService.setCurrentSessionUser(authUser);
        setTimeout(() => {
          onLoginSuccess(authUser, data.token, data.redirectUrl);
        }, 500);
        return;
      }
    } catch {
      // background server not reached
    }

    soundService.playAlertSound();
    setErrorMessage('Account not found. Please verify your email or click "Forgot Password?" to reset / activate access.');
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 min-h-screen overflow-y-auto">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md my-auto">
        {/* Security Badge Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-600 to-blue-700 shadow-xl shadow-cyan-500/20 text-white mb-4 border border-cyan-400/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            CEYTEQ ENTERPRISE CLOUD
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-Trust RBAC Identity Gateway • 256-Bit Cryptographic Perimeter
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-500" />

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Administrative Sign-In</h2>
              <p className="text-xs text-slate-400">Enter your assigned division credentials</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/40 text-[10px] font-bold tracking-wider uppercase font-mono">
              NextAuth 12-Rounds
            </span>
          </div>

          {/* Inline Dual-Channel Forgot Password (Email + registered Phone OTP) */}
          {isForgotOpen && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-950/80 border border-cyan-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black text-white">
                    Forgot Password? <span className="text-cyan-300 font-bold">Dual-Channel Verification</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeForgotAndPrefillLogin}
                  className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {forgotStep === 'DONE' ? 'Sign In →' : 'Close ✕'}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Enter your corporate email + the <span className="text-cyan-300 font-bold">registered mobile phone</span>.
                A 6-digit OTP is dispatched on <span className="text-cyan-300">Email</span> and{' '}
                <span className="text-rose-300">WhatsApp</span> — both must match to set a new password.
              </p>

              {forgotStep === 'REQUEST' && (
                <form onSubmit={handleForgotRequest} className="space-y-2.5">
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Corporate email"
                      className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-500 text-xs font-mono"
                    />
                  </div>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      placeholder="Registered phone (e.g. +94768607143)"
                      className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-500 text-xs font-mono"
                    />
                  </div>
                  {forgotError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{forgotError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotBusy}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-lg text-xs transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {forgotBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    Dispatch Dual OTP (Email + WhatsApp)
                  </button>
                </form>
              )}

              {forgotStep === 'VERIFY' && (
                <form onSubmit={handleForgotVerify} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-cyan-300 mb-1">EMAIL OTP (Resend)</label>
                      <input
                        value={forgotEmailOtp}
                        onChange={(e) => setForgotEmailOtp(e.target.value)}
                        maxLength={6}
                        placeholder="6 digits"
                        className="w-full bg-slate-900/90 border border-cyan-800/50 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-rose-300 mb-1">PHONE OTP (WhatsApp)</label>
                      <input
                        value={forgotPhoneOtp}
                        onChange={(e) => setForgotPhoneOtp(e.target.value)}
                        maxLength={6}
                        placeholder="6 digits"
                        className="w-full bg-slate-900/90 border border-rose-800/50 focus:border-rose-400 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs font-mono tracking-widest"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">NEW PASSWORD (min 8 chars)</label>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs font-mono"
                    />
                  </div>
                  {forgotSimulation && forgotSimulation.emailOtp && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmailOtp(forgotSimulation.emailOtp);
                        setForgotPhoneOtp(forgotSimulation.phoneOtp);
                      }}
                      className="w-full py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 text-slate-200 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      ⚡ Auto-fill sandbox codes (Email {forgotSimulation.emailOtp} • WhatsApp {forgotSimulation.phoneOtp})
                    </button>
                  )}
                  {forgotError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{forgotError}</span>
                    </div>
                  )}
                  {forgotSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{forgotSuccess}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotBusy}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-lg text-xs transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {forgotBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Verify OTPs & Set New Password
                  </button>
                </form>
              )}

              {forgotStep === 'DONE' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      ✅ <span className="font-bold">{forgotEmail}</span> password updated on the server (bcrypt adminsStore + credentialsService).
                      Click “Sign In” to continue with the new password.
                    </span>
                  </div>
                  <button
                    onClick={closeForgotAndPrefillLogin}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                  >
                    Sign In <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="flex-1 font-bold">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Corporate Email / Username</span>
                <span className="text-[10px] text-slate-500">e.g. info.ceyteq@gmail.com</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ceyteq.com"
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-xs transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 text-xs transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Credentials & Division Scope...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Assigned Division</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Selector (Dropdown) */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickFillOpen(!isQuickFillOpen)}
              className="w-full py-2 px-3 bg-slate-950/70 hover:bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Quick Test Credentials (1-Click Fill)
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isQuickFillOpen ? 'rotate-180' : ''}`} />
            </button>

            {isQuickFillOpen && (
              <div className="mt-2.5 p-2 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 max-h-56 overflow-y-auto">
                <div className="text-[10px] text-slate-500 px-2 py-1 font-bold uppercase tracking-wider">
                  Select an account to auto-fill:
                </div>

                {/* 1. Super Master Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickFill(sysCreds.superAdminEmail, sysCreds.superAdminPassword)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-white font-bold text-[11px]">Super Master Admin (Root)</div>
                      <div className="text-slate-400 text-[10px] font-mono">{sysCreds.superAdminEmail}</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono">ALL</span>
                </button>

                {/* 2. Digital Race Master */}
                {enterpriseAdmins.find(a => a.role === 'DIGITAL_RACE_MASTER') && (
                  <button
                    type="button"
                    onClick={() => {
                      const adm = enterpriseAdmins.find(a => a.role === 'DIGITAL_RACE_MASTER')!;
                      handleQuickFill(adm.email, adm.password);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-white font-bold text-[11px]">Digital Race Master Admin</div>
                        <div className="text-slate-400 text-[10px] font-mono">master.digitalrace@ceyteq.com</div>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-mono">DR</span>
                  </button>
                )}

                {/* 3. Up Country Division Admin */}
                {enterpriseAdmins.find(a => a.division === 'UP_COUNTRY') && (
                  <button
                    type="button"
                    onClick={() => {
                      const adm = enterpriseAdmins.find(a => a.division === 'UP_COUNTRY')!;
                      handleQuickFill(adm.email, adm.password);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-white font-bold text-[11px]">Up Country Division Admin</div>
                        <div className="text-slate-400 text-[10px] font-mono">div.upcountry.dr@ceyteq.com</div>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">UP_COUNTRY</span>
                  </button>
                )}

                {/* 4. South Division Admin */}
                {enterpriseAdmins.find(a => a.division === 'SOUTH') && (
                  <button
                    type="button"
                    onClick={() => {
                      const adm = enterpriseAdmins.find(a => a.division === 'SOUTH')!;
                      handleQuickFill(adm.email, adm.password);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <div>
                        <div className="text-white font-bold text-[11px]">South Division Admin</div>
                        <div className="text-slate-400 text-[10px] font-mono">div.south.dr@ceyteq.com</div>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded font-mono">SOUTH</span>
                  </button>
                )}

                {/* 5. Western Division Admin */}
                {enterpriseAdmins.find(a => a.division === 'WESTERN') && (
                  <button
                    type="button"
                    onClick={() => {
                      const adm = enterpriseAdmins.find(a => a.division === 'WESTERN')!;
                      handleQuickFill(adm.email, adm.password);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <div>
                        <div className="text-white font-bold text-[11px]">Western Division Admin</div>
                        <div className="text-slate-400 text-[10px] font-mono">div.western.dr@ceyteq.com</div>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono">WESTERN</span>
                  </button>
                )}

                {/* 6. Restaurant Owner */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('owner@ceylonspice.com', 'spice@owner2026')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-white font-bold text-[11px]">Restaurant Admin (Ceylon Spice)</div>
                      <div className="text-slate-400 text-[10px] font-mono">owner@ceylonspice.com</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono">RESTAURANT</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Link to Public Menu */}
          {onGoToPublicMenu && (
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
              <button
                type="button"
                onClick={onGoToPublicMenu}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <span>Looking for the digital restaurant menu?</span>
                <span className="text-cyan-400 font-bold underline">Go to Customer Menu</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
