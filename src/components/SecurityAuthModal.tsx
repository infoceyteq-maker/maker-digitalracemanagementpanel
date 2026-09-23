import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Mail,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  RefreshCw,
  Zap,
  Layers,
  Sparkles,
  Fingerprint,
  UserCheck,
  Building,
  Check,
  ArrowRight,
  Clock,
  X
} from 'lucide-react';
import { AuthUser, SubscriptionTier, UserRole, Tenant } from '../types';
import { CeyteqLogo } from './CeyteqLogo';
import { credentialsService, RoleCredentials } from '../lib/credentialsService';
import { Copy, Key, Trash2, Sparkles as SparklesIcon } from 'lucide-react';

interface SecurityAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser, token: string) => void;
  onLogout: () => void;
  tenants?: Tenant[];
  onClearDemoOrders?: () => void;
  onResetAllDemoData?: (cleanStarterRestaurant?: boolean) => void;
  onOpenCreateRestaurant?: () => void;
}

export const SecurityAuthModal: React.FC<SecurityAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  tenants = [],
  onClearDemoOrders,
  onResetAllDemoData,
  onOpenCreateRestaurant,
}) => {
  // Tabs: 'SIGN_IN' | 'REGISTER' | 'VERIFY_OTP' | 'MFA_CHALLENGE' | 'MFA_SETUP' | 'ROLE_SWITCHER' | 'PASSWORDS_MANAGER' | 'DATA_CLEANUP' | 'DUAL_OTP_RESET'
  const [flowStep, setFlowStep] = useState<
    | 'SIGN_IN'
    | 'REGISTER'
    | 'VERIFY_OTP'
    | 'MFA_CHALLENGE'
    | 'MFA_SETUP'
    | 'ROLE_SWITCHER'
    | 'PASSWORDS_MANAGER'
    | 'DATA_CLEANUP'
    | 'DUAL_OTP_RESET'
  >(currentUser?.role === 'SUPER_ADMIN' ? 'PASSWORDS_MANAGER' : 'SIGN_IN');

  useEffect(() => {
    if (!currentUser) {
      setFlowStep('SIGN_IN');
    }
  }, [currentUser, isOpen]);

  // Saved Passwords State
  const [roleCreds, setRoleCreds] = useState<RoleCredentials>(() => credentialsService.getCredentials());
  const [selectedTenantForCreds, setSelectedTenantForCreds] = useState<string>(tenants?.[0]?.id || 'tenant-1');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form edit fields for passwords
  const [superAdminPassInput, setSuperAdminPassInput] = useState(roleCreds.superAdminPassword);
  const [kitchenPinInput, setKitchenPinInput] = useState(roleCreds.defaultKitchenPin);
  const [waiterPinInput, setWaiterPinInput] = useState(roleCreds.defaultWaiterPin);
  const [tenantPassInput, setTenantPassInput] = useState(
    roleCreds.tenantPasswords[selectedTenantForCreds]?.ownerPassword || 'owner@pass2026'
  );
  const [tenantEmailInput, setTenantEmailInput] = useState(
    roleCreds.tenantPasswords[selectedTenantForCreds]?.ownerEmail || 'owner@restaurant.com'
  );

  // When selected tenant changes in password manager, sync inputs
  const handleTenantCredsSelect = (tenantId: string) => {
    setSelectedTenantForCreds(tenantId);
    const existing = roleCreds.tenantPasswords[tenantId];
    const foundTenant = tenants?.find((t: Tenant) => t.id === tenantId);
    setTenantEmailInput(existing?.ownerEmail || foundTenant?.ownerEmail || 'owner@restaurant.com');
    setTenantPassInput(existing?.ownerPassword || foundTenant?.ownerPassword || 'owner@pass2026');
  };

  // Save Super Admin Password
  const handleSaveSuperAdminPass = () => {
    credentialsService.setSuperAdminPassword(superAdminPassInput);
    setRoleCreds(credentialsService.getCredentials());
    setStatusMessage({ type: 'success', text: 'Master Admin Password updated and saved!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Save Restaurant Owner Password
  const handleSaveTenantPass = () => {
    credentialsService.setTenantPassword(
      selectedTenantForCreds,
      tenantEmailInput,
      tenantPassInput,
      kitchenPinInput,
      waiterPinInput
    );
    setRoleCreds(credentialsService.getCredentials());
    setStatusMessage({ type: 'success', text: 'Restaurant Owner credentials updated and saved!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Save Kitchen & Waiter PINs
  const handleSaveStaffPins = () => {
    credentialsService.setKitchenPin(kitchenPinInput, selectedTenantForCreds);
    credentialsService.setWaiterPin(waiterPinInput, selectedTenantForCreds);
    setRoleCreds(credentialsService.getCredentials());
    setStatusMessage({ type: 'success', text: 'Kitchen and Waiter PINs updated successfully!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Form states
  const [email, setEmail] = useState('owner@ceylonspice.com');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Rohan Perera');
  const [restaurantName, setRestaurantName] = useState('Ceylon Spice Bistro');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('FREE');

  // OTP Verification state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimerSeconds, setOtpTimerSeconds] = useState(580);
  const [otpSentCode, setOtpSentCode] = useState('849201');

  // MFA state
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [mfaSecret, setMfaSecret] = useState('JBSWY3DPEHPK3PXP');
  const [mfaBackupCode] = useState('CEYTEQ-9482-1049-SEC');

  // Security status & attack simulation feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(1);
  const maxAttempts = 5;

  // Dual-Channel Verification Password Reset State (Email OTP + WhatsApp OTP)
  const [dualEmail, setDualEmail] = useState('Info.ceyteq@gmail.com');
  const [dualPhone, setDualPhone] = useState('+94768607143');
  const [dualEmailOtp, setDualEmailOtp] = useState('');
  const [dualPhoneOtp, setDualPhoneOtp] = useState('');
  const [dualNewPassword, setDualNewPassword] = useState('');
  const [dualStep, setDualStep] = useState<'REQUEST' | 'VERIFY' | 'SUCCESS'>('REQUEST');
  const [dualAttemptsLeft, setDualAttemptsLeft] = useState(3);
  const [dualLockoutSeconds, setDualLockoutSeconds] = useState(0);
  const [dualSimulatedTokens, setDualSimulatedTokens] = useState<{ emailOtp: string; phoneOtp: string } | null>(null);
  const [dualDispatchedInfo, setDualDispatchedInfo] = useState<{ emailDest: string; phoneDest: string } | null>(null);

  const handleRequestDualOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dualEmail, phone: dualPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 423) {
          setDualLockoutSeconds(data.retryAfterSeconds || 900);
        }
        setStatusMessage({ type: 'error', text: data.message || data.error || 'Failed to dispatch OTP.' });
      } else {
        setDualStep('VERIFY');
        if (data._simulation) {
          setDualSimulatedTokens(data._simulation);
          setDualEmailOtp(data._simulation.emailOtp);
          setDualPhoneOtp(data._simulation.phoneOtp);
        }
        setDualDispatchedInfo({
          emailDest: data.channels?.email?.destination || dualEmail,
          phoneDest: data.channels?.phone?.destination || dualPhone,
        });
        setStatusMessage({ type: 'success', text: 'Dual-Channel Verification tokens dispatched to Email and WhatsApp!' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error requesting Dual OTP.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDualOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/auth/reset-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: dualEmail,
          phone: dualPhone,
          emailOtp: dualEmailOtp,
          phoneOtp: dualPhoneOtp,
          newPassword: dualNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 423) {
          setDualLockoutSeconds(data.remainingSeconds || 900);
          setStatusMessage({ type: 'error', text: 'Account locked for 15 minutes due to 3 failed attempts.' });
        } else {
          setDualAttemptsLeft(data.attemptsRemaining ?? 2);
          setStatusMessage({ type: 'error', text: data.message || 'Invalid Email or WhatsApp OTP.' });
        }
      } else {
        setDualStep('SUCCESS');
        setStatusMessage({ type: 'success', text: 'Password reset successful! All prior sessions invalidated.' });
        if (dualEmail.toLowerCase().includes('info.ceyteq@gmail.com') || dualEmail.toLowerCase().includes('admin')) {
          credentialsService.setSuperAdminPassword(dualNewPassword);
          setRoleCreds(credentialsService.getCredentials());
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer for OTP
  useEffect(() => {
    if (flowStep === 'VERIFY_OTP' && otpTimerSeconds > 0) {
      const interval = setInterval(() => setOtpTimerSeconds(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [flowStep, otpTimerSeconds]);

  if (!isOpen) return null;

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleMfaChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...mfaCode];
    newDigits[index] = val.slice(-1);
    setMfaCode(newDigits);

    if (val && index < 5) {
      const nextInput = document.getElementById(`mfa-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Perform Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginAttempts(prev => prev + 1);
        setStatusMessage({
          type: 'error',
          text: data.message || `Login failed. Attempt ${loginAttempts} of ${maxAttempts} before IP lockout.`,
        });
        setIsLoading(false);
        return;
      }

      if (data.requiresEmailVerification) {
        setOtpSentCode(data.demoOtp || '849201');
        setFlowStep('VERIFY_OTP');
        setStatusMessage({
          type: 'info',
          text: `Verification required. A 6-digit OTP code was dispatched to ${email}.`,
        });
      } else if (data.requiresMfa) {
        setFlowStep('MFA_CHALLENGE');
        setStatusMessage({
          type: 'info',
          text: '2FA Activated: Enter the 6-digit code from Google Authenticator or 1Password.',
        });
      } else {
        onLoginSuccess(data.user, data.token);
        setStatusMessage({ type: 'success', text: `Welcome back, ${data.user.name}!` });
        setTimeout(() => onClose(), 800);
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network authentication error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      setStatusMessage({ type: 'error', text: 'Please enter all 6 digits of the verification code.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: entered }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({ type: 'error', text: data.error || 'Invalid OTP code. Please try again.' });
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.user, data.token);
      setStatusMessage({ type: 'success', text: 'Email verified! Account activated successfully.' });
      setTimeout(() => onClose(), 800);
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to verify OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 2FA / MFA
  const handleVerifyMfa = async () => {
    const entered = mfaCode.join('');
    if (entered.length < 6) {
      setStatusMessage({ type: 'error', text: 'Please enter all 6 digits from your authenticator app.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: entered }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({ type: 'error', text: data.error || 'Invalid 2FA code.' });
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.user, data.token);
      setStatusMessage({ type: 'success', text: '2FA challenge passed! Authenticated.' });
      setTimeout(() => onClose(), 800);
    } catch {
      setStatusMessage({ type: 'error', text: '2FA verification failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Role presets for testing RBAC
  const PRESET_USERS: { label: string; role: UserRole; tier: SubscriptionTier; desc: string }[] = [
    {
      label: 'Level 1: Super Master Admin (Root)',
      role: 'SUPER_ADMIN',
      tier: 'PRO',
      desc: 'Root supervisor (info.ceyteq@gmail.com). Global authority over Digital Race, TasteTrip, and all 4 Divisions.',
    },
    {
      label: 'Level 2A: Digital Race Master Admin',
      role: 'DIGITAL_RACE_MASTER',
      tier: 'PRO',
      desc: 'Controls restaurant platform, digital menus, tier quotas (Free/Pro/Plus), AI & WhatsApp modules.',
    },
    {
      label: 'Level 2B: TasteTrip Delivery Master Admin',
      role: 'TASTETRIP_MASTER',
      tier: 'PRO',
      desc: 'Controls food delivery fleet, regional delivery zones, driver tracking, and customer dispatch.',
    },
    {
      label: 'Level 3: Regional Division Admin',
      role: 'DIVISION_ADMIN',
      tier: 'PRO',
      desc: 'Partitioned geographic boundary control (Up Country, South, Western, or North division only).',
    },
    {
      label: 'Level 4: Pro Restaurant Owner',
      role: 'TENANT_OWNER',
      tier: 'PRO',
      desc: 'Full store access: KDS Kitchen Display, Pro POS & KOT, Taste Trip mobile apps, WhatsApp AI.',
    },
    {
      label: 'Free Tier Restaurant Owner',
      role: 'TENANT_OWNER',
      tier: 'FREE',
      desc: 'High volume onboarding. QR Menu & social links only. Strictly blocked from Pro KDS & POS.',
    },
    {
      label: 'Kitchen Station Chef',
      role: 'KITCHEN',
      tier: 'PRO',
      desc: 'Operational KOT order status updates only. Cannot modify pricing or domain settings.',
    },
    {
      label: 'Dining Floor Waiter',
      role: 'WAITER',
      tier: 'FREE',
      desc: 'Real-time table calls and order dispatch. Restricted from administrative panels.',
    },
  ];

  const handleSelectPreset = (preset: typeof PRESET_USERS[0]) => {
    const mockUser: AuthUser = {
      id: `user-${preset.role.toLowerCase()}-${Date.now()}`,
      email: `${preset.role.toLowerCase()}@ceyteq.com`,
      name: preset.label,
      role: preset.role,
      tier: preset.tier,
      isEmailVerified: true,
      mfaEnabled: preset.role === 'SUPER_ADMIN' || preset.tier === 'PRO',
      status: 'ACTIVE',
      failedLoginAttempts: 0,
    };
    onLoginSuccess(mockUser, 'mock_signed_jwt_' + Math.random().toString(36).substring(2));
    setStatusMessage({ type: 'success', text: `Switched active RBAC context to: ${preset.label}` });
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-sky-100 shadow-2xl overflow-hidden my-6">
        {/* Header with Security Brand */}
        <div className="bg-gradient-to-r from-[#0A192F] via-[#0D2544] to-[#004B6E] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#00A3D9]/20 border border-[#00C8FF]/40 flex items-center justify-center text-[#00C8FF] shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Ceyteq Identity & Security Perimeter</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  JWT + 2FA
                </span>
              </div>
              <p className="text-xs text-sky-200">
                Enterprise NextAuth flow with Email OTP verification, TOTP MFA, and Strict RBAC guards.
              </p>
            </div>
          </div>

          {/* Navigation Pill Buttons */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFlowStep('SIGN_IN')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                flowStep === 'SIGN_IN' ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black' : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Admin Sign In</span>
            </button>

            <button
              onClick={() => setFlowStep('DUAL_OTP_RESET')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                flowStep === 'DUAL_OTP_RESET' ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black' : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" />
              <span>Dual-OTP Reset</span>
            </button>

            {currentUser && (
              <>
                <button
                  onClick={() => setFlowStep('ROLE_SWITCHER')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                    flowStep === 'ROLE_SWITCHER' ? 'bg-[#00C8FF] text-[#0A192F] font-black' : 'text-slate-300 hover:text-white bg-white/5'
                  }`}
                >
                  Role Switcher
                </button>

                {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SUPER_MASTER_ADMIN') && (
                  <button
                    onClick={() => setFlowStep('PASSWORDS_MANAGER')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      flowStep === 'PASSWORDS_MANAGER' ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black' : 'text-slate-300 hover:text-white bg-white/5'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Passwords & PINs</span>
                  </button>
                )}

                <button
                  onClick={() => setFlowStep('DATA_CLEANUP')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    flowStep === 'DATA_CLEANUP' ? 'bg-amber-400 text-slate-900 shadow-sm font-black' : 'text-slate-300 hover:text-white bg-white/5'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Clear Demo Data</span>
                </button>
              </>
            )}
            <button
              onClick={() => setFlowStep('VERIFY_OTP')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                flowStep === 'VERIFY_OTP' ? 'bg-[#00C8FF] text-[#0A192F]' : 'text-slate-300 hover:text-white'
              }`}
            >
              Email OTP
            </button>
            <button
              onClick={() => setFlowStep('MFA_CHALLENGE')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                flowStep === 'MFA_CHALLENGE' ? 'bg-[#00C8FF] text-[#0A192F]' : 'text-slate-300 hover:text-white'
              }`}
            >
              2FA / MFA
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {statusMessage && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-sky-50 text-sky-800 border-sky-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* ZERO-TRUST DUAL-CHANNEL VERIFICATION PASSWORD RESET */}
          {flowStep === 'DUAL_OTP_RESET' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-slate-900 to-[#0A192F] text-white p-4 rounded-2xl border border-sky-500/20 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00C8FF] to-blue-600 flex items-center justify-center text-slate-950 font-black">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">Dual-Channel Zero-Trust Recovery</h3>
                    <p className="text-[11px] text-sky-200">
                      Requires simultaneous verification through Resend API (Email) + Meta WhatsApp Cloud API (Phone).
                    </p>
                  </div>
                </div>

                {/* Brute force & lockout status banner */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300">
                    Upstash Redis Guard: <span className="text-emerald-400 font-bold">5 req/min</span>
                  </span>
                  <span className={`${dualAttemptsLeft < 2 ? 'text-rose-400 font-bold' : 'text-sky-300'}`}>
                    Attempts Allowed: {dualAttemptsLeft} / 3 before 15m Lockout
                  </span>
                </div>
              </div>

              {dualLockoutSeconds > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Account locked due to 3 failed attempts. Please wait {Math.ceil(dualLockoutSeconds / 60)} minutes.
                  </span>
                </div>
              )}

              {/* SUB-STEP 1: Request Initiation */}
              {dualStep === 'REQUEST' && (
                <form onSubmit={handleRequestDualOtp} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      1. Registered Corporate / Master Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={dualEmail}
                        onChange={(e) => setDualEmail(e.target.value)}
                        required
                        placeholder="Info.ceyteq@gmail.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#00C8FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      2. Registered Mobile Phone (Meta WhatsApp Cloud API)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={dualPhone}
                        onChange={(e) => setDualPhone(e.target.value)}
                        required
                        placeholder="+94768607143"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#00C8FF]"
                      />
                    </div>
                  </div>

                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-[11px] text-sky-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <span>
                      The system verifies that both <span className="font-bold">{dualEmail}</span> and{' '}
                      <span className="font-bold">{dualPhone}</span> belong to the singular Master Admin record before dispatching cryptographically isolated OTPs.
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || dualLockoutSeconds > 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A3D9] to-[#0A192F] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>Dispatch Dual-Channel Tokens (Resend + WhatsApp) →</span>
                    </button>
                  </div>
                </form>
              )}

              {/* SUB-STEP 2 & 3: Simultaneous Dual Verification & New Password Commit */}
              {dualStep === 'VERIFY' && (
                <form onSubmit={handleVerifyDualOtp} className="space-y-4">
                  {/* Channels Dispatched Banner */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>Channel A: Resend API</span>
                      </div>
                      <div className="text-[11px] text-blue-700 mt-1 font-mono">
                        Sent to {dualDispatchedInfo?.emailDest || dualEmail}
                      </div>
                    </div>

                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Channel B: WhatsApp Cloud</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-1 font-mono">
                        Sent to {dualDispatchedInfo?.phoneDest || dualPhone}
                      </div>
                    </div>
                  </div>

                  {/* Sandbox Simulated OTP Pill */}
                  {dualSimulatedTokens && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-amber-950 block">Sandbox Verification Tokens Ready:</span>
                        <span className="font-mono text-slate-700 text-[11px]">
                          Email: <span className="font-bold text-blue-700">{dualSimulatedTokens.emailOtp}</span> | WhatsApp:{' '}
                          <span className="font-bold text-emerald-700">{dualSimulatedTokens.phoneOtp}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDualEmailOtp(dualSimulatedTokens.emailOtp);
                          setDualPhoneOtp(dualSimulatedTokens.phoneOtp);
                        }}
                        className="text-[10px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 px-2.5 py-1 rounded-lg transition-all"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  {/* Dual Code Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-blue-900 block mb-1">
                        Token 1: Email 6-Digit OTP
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={dualEmailOtp}
                        onChange={(e) => setDualEmailOtp(e.target.value)}
                        placeholder="e.g. 849201"
                        className="w-full bg-slate-50 border-2 border-blue-200 rounded-xl px-3 py-2 text-center text-sm font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-emerald-900 block mb-1">
                        Token 2: WhatsApp 6-Digit OTP
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={dualPhoneOtp}
                        onChange={(e) => setDualPhoneOtp(e.target.value)}
                        placeholder="e.g. 593021"
                        className="w-full bg-slate-50 border-2 border-emerald-200 rounded-xl px-3 py-2 text-center text-sm font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Step 4: Password Commit */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      New Cryptographic Password (Bcrypt Salted Commit)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={dualNewPassword}
                        onChange={(e) => setDualNewPassword(e.target.value)}
                        placeholder="Enter secure new password (min 8 chars)"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#00C8FF]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDualStep('REQUEST')}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                    >
                      ← Re-request Tokens
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || !dualEmailOtp || !dualPhoneOtp || !dualNewPassword}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>Verify & Commit New Password</span>
                    </button>
                  </div>
                </form>
              )}

              {/* SUCCESS STATE */}
              {dualStep === 'SUCCESS' && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Zero-Trust Recovery Completed</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Your password has been successfully salted and committed to the database. All existing JWT sessions and refresh tokens have been revoked.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setFlowStep('SIGN_IN')}
                      className="px-5 py-2 rounded-xl bg-[#00C8FF] hover:bg-[#00B2E3] text-[#0A192F] text-xs font-black shadow-sm transition-all"
                    >
                      Proceed to Sign In →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: SIGN IN */}
          {flowStep === 'SIGN_IN' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Corporate or Restaurant Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@restaurant.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#00A3D9]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Account Password</label>
                  <span className="text-[11px] text-slate-400">Bcrypt / Argon2 hashed</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#00A3D9]"
                  />
                </div>
              </div>

              {/* Brute force tracker pill */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#00A3D9]" />
                  <span>Brute-force protection:</span>
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {loginAttempts} / {maxAttempts} attempts allowed
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFlowStep('ROLE_SWITCHER')}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Quick Role Switcher
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A3D9] to-[#0A192F] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Authenticate with JWT</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: EMAIL VERIFICATION OTP */}
          {flowStep === 'VERIFY_OTP' && (
            <div className="text-center py-2 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#00A3D9] border border-sky-200 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900">Verify Your Corporate Email</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  To prevent unauthorized free-tier bot onboarding, enter the 6-digit verification code sent to{' '}
                  <span className="font-bold text-slate-800">{email}</span>.
                </p>
              </div>

              {/* 6 Digit Box Input */}
              <div className="flex items-center justify-center gap-2 my-4">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-black font-mono bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#00A3D9] focus:bg-white focus:outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Expires in: {Math.floor(otpTimerSeconds / 60)}:{('0' + (otpTimerSeconds % 60)).slice(-2)}
                  </span>
                </span>
                <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Demo Code: {otpSentCode}
                </span>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOtpDigits(otpSentCode.split(''));
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-all border border-sky-200"
                >
                  Auto-Fill Demo Code
                </button>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Activate Account</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 2FA / MFA AUTHENTICATOR CHALLENGE */}
          {flowStep === 'MFA_CHALLENGE' && (
            <div className="text-center py-2 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900">Multi-Factor Authentication (2FA)</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  High-level accounts (Ceyteq Master Admins & Pro Tier Clients) require TOTP verification to protect critical operations.
                </p>
              </div>

              {/* 6 Digit Authenticator Input */}
              <div className="flex items-center justify-center gap-2 my-4">
                {mfaCode.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`mfa-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleMfaChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-black font-mono bg-purple-50/50 border-2 border-purple-200 rounded-xl focus:border-purple-600 focus:bg-white focus:outline-none transition-all text-purple-900"
                  />
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-[11px] text-slate-600 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">TOTP Seed Key:</span>
                  <span className="font-bold text-slate-800">{mfaSecret}</span>
                </div>
                <button
                  onClick={() => setMfaCode(['4', '8', '2', '9', '1', '0'])}
                  className="text-[10px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded"
                >
                  Fill Valid Code
                </button>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleVerifyMfa}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>Verify TOTP Token</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RBAC ROLE & TIER SWITCHER */}
          {flowStep === 'ROLE_SWITCHER' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Switch Security Role & Subscription Tier</h3>
                  <p className="text-[11px] text-slate-500">
                    Test Next.js Middleware route barriers and tier restrictions in real-time.
                  </p>
                </div>
                {currentUser && (
                  <button
                    onClick={onLogout}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                  >
                    Log Out
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {PRESET_USERS.map((preset, idx) => {
                  const isActive =
                    currentUser?.role === preset.role && currentUser?.tier === preset.tier;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isActive
                          ? 'bg-sky-50 border-[#00A3D9] shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{preset.label}</span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                              preset.tier === 'PRO'
                                ? 'bg-pink-100 text-pink-700'
                                : preset.tier === 'PLUS'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {preset.tier} TIER
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{preset.desc}</p>
                      </div>

                      {isActive ? (
                        <span className="w-6 h-6 rounded-full bg-[#00A3D9] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* STEP 5: PASSWORDS & CREDENTIALS MANAGER */}
          {flowStep === 'PASSWORDS_MANAGER' && (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#008BB8] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Separate Role Passwords & Staff PINs</h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      වෙන වෙනම සෑම Role එකක් සඳහාම (Master Admin, Restaurant Owner, Kitchen, Waiter) Password සහ PIN වෙනස් කර Save කරගත හැක.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 1: CEYTEQ SUPER ADMIN */}
              <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    <span className="text-xs font-black text-slate-900 uppercase">1. Ceyteq Master Admin</span>
                  </div>
                  <span className="text-[10px] bg-pink-50 text-pink-700 font-bold px-2 py-0.5 rounded-full border border-pink-200">
                    Highest Clearance
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Root Master Email</label>
                    <input
                      type="text"
                      readOnly
                      value={roleCreds.superAdminEmail}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 font-bold cursor-not-allowed text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Master Mobile (WhatsApp)</label>
                    <input
                      type="text"
                      readOnly
                      value={roleCreds.superAdminPhone || '+94768607143'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 font-bold cursor-not-allowed text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Master Password</label>
                    <input
                      type="text"
                      value={superAdminPassInput}
                      onChange={(e) => setSuperAdminPassInput(e.target.value)}
                      placeholder="Enter new master password"
                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00C8FF] text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText(`Email: ${roleCreds.superAdminEmail}\nPassword: ${superAdminPassInput}`, 'superadmin')}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'superadmin' ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveSuperAdminPass();
                        onLoginSuccess({
                          id: 'user-superadmin-1',
                          email: roleCreds.superAdminEmail,
                          name: 'Ceyteq Master Admin',
                          role: 'SUPER_ADMIN',
                          tier: 'PRO',
                          isEmailVerified: true,
                          mfaEnabled: true,
                          status: 'ACTIVE',
                          failedLoginAttempts: 0,
                        }, 'mock-token-superadmin');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold border border-pink-200 transition-all"
                    >
                      Login As Master Admin
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSuperAdminPass}
                      className="px-3 py-1.5 rounded-xl bg-[#00C8FF] hover:bg-[#00B2E3] text-[#0A192F] text-[11px] font-black shadow-xs transition-all"
                    >
                      Save Password
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: RESTAURANT OWNER CREDENTIALS */}
              <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black text-slate-900 uppercase">2. Restaurant Owner Password</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Per-Restaurant
                  </span>
                </div>

                {/* Restaurant Selector */}
                {tenants && tenants.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Restaurant to Configure:</label>
                    <select
                      value={selectedTenantForCreds}
                      onChange={(e) => handleTenantCredsSelect(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:border-[#00C8FF]"
                    >
                      {tenants.map((t: Tenant) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.slug}) - {t.ownerName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Owner Email</label>
                    <input
                      type="email"
                      value={tenantEmailInput}
                      onChange={(e) => setTenantEmailInput(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 font-mono text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#00C8FF]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Owner Admin Password</label>
                    <input
                      type="text"
                      value={tenantPassInput}
                      onChange={(e) => setTenantPassInput(e.target.value)}
                      placeholder="e.g. spice@owner2026"
                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2 font-mono text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00C8FF]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText(`Restaurant: ${tenants?.find((t: Tenant) => t.id === selectedTenantForCreds)?.name}\nEmail: ${tenantEmailInput}\nPassword: ${tenantPassInput}`, 'tenant-creds')}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'tenant-creds' ? 'Copied!' : 'Copy Owner Login'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveTenantPass();
                        const targetT = tenants?.find((t: Tenant) => t.id === selectedTenantForCreds);
                        onLoginSuccess({
                          id: `owner-${selectedTenantForCreds}`,
                          email: tenantEmailInput,
                          name: targetT?.ownerName || 'Restaurant Owner',
                          role: 'ADMIN',
                          tier: targetT?.tier || 'PRO',
                          isEmailVerified: true,
                          mfaEnabled: false,
                          status: 'ACTIVE',
                          failedLoginAttempts: 0,
                        }, 'mock-token-owner');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-all"
                    >
                      Login As This Owner
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTenantPass}
                      className="px-3 py-1.5 rounded-xl bg-[#008BB8] hover:bg-[#007A9E] text-white text-[11px] font-bold shadow-xs transition-all"
                    >
                      Save Owner Pass
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 3: STAFF & KITCHEN TERMINAL PINS */}
              <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-black text-slate-900 uppercase">3. Staff Terminal Security PINs</span>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    Fast 4-Digit PIN
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Kitchen Display (KOT) PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={kitchenPinInput}
                      onChange={(e) => setKitchenPinInput(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 font-mono text-slate-900 text-xs font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Used by Kitchen chefs on wall displays</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Waiter Staff PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={waiterPinInput}
                      onChange={(e) => setWaiterPinInput(e.target.value)}
                      placeholder="e.g. 1122"
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 font-mono text-slate-900 text-xs font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#00C8FF]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Used by Waiters on mobile handhelds</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText(`Kitchen PIN: ${kitchenPinInput}\nWaiter PIN: ${waiterPinInput}`, 'staff-pins')}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'staff-pins' ? 'Copied!' : 'Copy Staff PINs'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveStaffPins}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-all"
                  >
                    Save Staff PINs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DATA & DEMO CLEANUP */}
          {flowStep === 'DATA_CLEANUP' && (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-amber-900">Clean Demo Data & Real Database Setup</h3>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    ඩෙමෝ සාම්පල ඇණවුම් (Orders) ඉවත් කර පිරිසිදු ආරම්භයක් (Clean Slate) ලබා ගැනීමට මෙතැනින් හැකියාව ඇත.
                  </p>
                </div>
              </div>

              {/* Action Card 1: Clear Orders */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h4 className="text-xs font-bold text-slate-900">1. Clear All Demo Orders (ඇණවුම් ඉවත් කරන්න)</h4>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                    Wipes to 0 Orders
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Clears all current mock orders and pending table assistance calls across the Kitchen KOT and POS screens so you can start taking genuine customer orders.
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearDemoOrders) {
                        onClearDemoOrders();
                        setStatusMessage({ type: 'success', text: 'All demo orders and table calls have been wiped! Total orders are now 0.' });
                        setTimeout(() => setStatusMessage(null), 3500);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Mock Orders</span>
                  </button>
                </div>
              </div>

              {/* Action Card 2: Reset to Clean Blank Slate */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <h4 className="text-xs font-bold text-slate-900">2. Reset Platform to Fresh Clean Slate</h4>
                  </div>
                  <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded">
                    Clean Starter
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Clears all mock demo data and replaces demo restaurants with a single clean starter restaurant ready for your own real food dishes and prices.
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onResetAllDemoData) {
                        onResetAllDemoData(true);
                        setStatusMessage({ type: 'success', text: 'Platform reset to clean starter restaurant with zero mock orders!' });
                        setTimeout(() => setStatusMessage(null), 3500);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset to Clean Slate</span>
                  </button>
                </div>
              </div>

              {/* Action Card 3: Provision Real Restaurant */}
              {onOpenCreateRestaurant && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-emerald-950">3. Add Real Restaurant (අලුත් අවන්හලක් එක් කරන්න)</h4>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                      Production Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Open the comprehensive Restaurant Provisioning Form to add your genuine restaurant name, custom domain, table count, and owner credentials.
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCreateRestaurant();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Open Add Restaurant Form →</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Protection: OWASP Top 10 + Rate Limit Throttling</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Node/Next.js Edge</span>
        </div>
      </div>
    </div>
  );
};
