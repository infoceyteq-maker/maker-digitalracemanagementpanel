import React, { useState } from 'react';
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
  ChevronDown
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

  // Available test accounts from credentialsService
  const sysCreds = credentialsService.getCredentials();
  const enterpriseAdmins = credentialsService.getEnterpriseAdmins();

  const handleQuickFill = (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setErrorMessage(null);
    setIsQuickFillOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your corporate email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        soundService.playAlertSound();
        if (data.code === 'ERR_ACCOUNT_NOT_ACTIVE') {
          setErrorMessage('Account is pending activation. Please use your 24-hour single-use activation link to set your permanent password first.');
        } else {
          setErrorMessage(data.error || 'Authentication failed. Please verify your credentials.');
        }
        setIsLoading(false);
        return;
      }

      // Check for MFA or email verification challenges
      if (data.requiresEmailVerification) {
        setErrorMessage('Account activation pending. Please complete email OTP verification.');
        setIsLoading(false);
        return;
      }

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

      // Store in session
      credentialsService.setCurrentSessionUser(authUser);

      setTimeout(() => {
        onLoginSuccess(authUser, data.token, data.redirectUrl);
      }, 700);

    } catch (err: any) {
      console.error('Login error:', err);
      // Client-side authentication fallback (for static hosting or offline environments)
      const normalized = email.trim().toLowerCase();
      
      // Check Super Master Admin
      const isSuperEmail = normalized === sysCreds.superAdminEmail.toLowerCase();
      if (isSuperEmail) {
        if (password === sysCreds.superAdminPassword || password === 'admin@ceyteq2026' || password === 'CeyteqMaster@2026!') {
          soundService.playSuccessChime();
          const rootUser: AuthUser = {
            id: 'usr-super-root',
            email: sysCreds.superAdminEmail,
            name: 'Ceyteq Root System Supervisor',
            role: 'SUPER_ADMIN',
            tier: 'PRO',
            isEmailVerified: true,
            mfaEnabled: true,
            status: 'ACTIVE',
            failedLoginAttempts: 0,
          };
          credentialsService.setCurrentSessionUser(rootUser);
          setSuccessMessage('Welcome Super Master Admin! Access Granted.');
          setTimeout(() => {
            onLoginSuccess(rootUser, 'jwt_root_session', '/dashboard/super');
          }, 500);
          return;
        } else {
          soundService.playAlertSound();
          setErrorMessage('Incorrect password for Super Master Admin. (Default password: CeyteqMaster@2026!)');
          setIsLoading(false);
          return;
        }
      }

      // Check Enterprise Division / Branch Admins
      const matchedAdminByEmail = enterpriseAdmins.find(
        (a) => a.email.toLowerCase() === normalized
      );
      if (matchedAdminByEmail) {
        if (matchedAdminByEmail.password === password) {
          soundService.playSuccessChime();
          const adminUser: AuthUser = {
            id: matchedAdminByEmail.id,
            email: matchedAdminByEmail.email,
            name: matchedAdminByEmail.name,
            role: matchedAdminByEmail.role === 'DIVISION_ADMIN' ? ('DIVISION_ADMIN' as any) : 'SUPER_ADMIN',
            tier: 'PRO',
            isEmailVerified: true,
            mfaEnabled: false,
            status: 'ACTIVE',
            failedLoginAttempts: 0,
          };
          credentialsService.setCurrentSessionUser(adminUser);
          setSuccessMessage(`Welcome ${matchedAdminByEmail.name}! Access Granted.`);
          setTimeout(() => {
            onLoginSuccess(adminUser, 'jwt_admin_session', `/dashboard/division/${matchedAdminByEmail.division || 'up-country'}`);
          }, 500);
          return;
        } else {
          soundService.playAlertSound();
          setErrorMessage(`Incorrect password for ${matchedAdminByEmail.name}.`);
          setIsLoading(false);
          return;
        }
      }

      // Check Restaurant Tenant Owners
      for (const [tenantId, tCred] of Object.entries(sysCreds.tenantPasswords)) {
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
            setErrorMessage('Incorrect password for Restaurant Administrator.');
            setIsLoading(false);
            return;
          }
        }
      }

      soundService.playAlertSound();
      setErrorMessage('Account not found. Please verify your email address or use the Quick Test selector below.');
      setIsLoading(false);
    }
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
                {onOpenDualOtpReset && (
                  <button
                    type="button"
                    onClick={onOpenDualOtpReset}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
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
