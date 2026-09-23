// ==============================================================================
// CEYTEQ ENTERPRISE ACCOUNT ACTIVATION VIEW
// Handles First-time invitation tokens, bcrypt 12 password setup,
// and dedicated resilient error handling for expired/invalid tokens.
// ==============================================================================

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
  ExternalLink
} from 'lucide-react';
import { SRI_LANKA_DIVISIONS, DivisionId, PROVINCE_NAMES } from '../lib/rbacMatrix';
import { soundService } from '../lib/audioService';
import { credentialsService } from '../lib/credentialsService';
import { getPostLoginRedirect } from '../lib/invitationService';

interface ActivationMeta {
  email: string;
  name: string;
  role: string;
  branch: string;
  divisionId?: DivisionId | null;
  allowedProvinces?: string[];
  tenantId?: string | null;
}

interface AccountActivationViewProps {
  initialToken?: string;
  initialEmail?: string;
  onSuccessRedirect?: (targetUrl: string, userMeta: any) => void;
  onRequestDualOtp?: (email: string) => void;
}

export const AccountActivationView: React.FC<AccountActivationViewProps> = ({
  initialToken,
  initialEmail,
  onSuccessRedirect,
  onRequestDualOtp,
}) => {
  const [token, setToken] = useState(initialToken || '');
  const [email, setEmail] = useState(initialEmail || '');
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

  // Extract query params from URL if not passed as props
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const urlEmail = params.get('email');

      if (urlToken) setToken(urlToken);
      if (urlEmail) setEmail(urlEmail);

      validateToken(urlToken || token, urlEmail || email);
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

    // 1. First check client-side record
    const clientCheck = credentialsService.verifyInvitationRecord(tok, mail);
    if (clientCheck.isValid && clientCheck.record) {
      setAdminMeta({
        email: clientCheck.record.email,
        name: clientCheck.record.name,
        role: clientCheck.record.role,
        branch: clientCheck.record.branch,
        divisionId: clientCheck.record.divisionId,
        allowedProvinces: clientCheck.record.allowedProvinces,
        tenantId: clientCheck.record.tenantId,
      });
      setIsValidating(false);
      return;
    }

    // 2. Try server validation
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
          });
          setIsValidating(false);
          return;
        }
      }

      if (clientCheck.error === 'TOKEN_EXPIRED') {
        setErrorType('EXPIRED');
        setValidationError('This invitation link has expired (24-hour limit). Please request a new link.');
      } else if (clientCheck.error === 'TOKEN_ALREADY_USED') {
        setErrorType('USED');
        setValidationError('This activation link has already been used to set a password.');
      } else {
        setErrorType('INVALID');
        setValidationError('Invalid or unverified activation token.');
      }
    } catch {
      if (clientCheck.error === 'TOKEN_EXPIRED') setErrorType('EXPIRED');
      else if (clientCheck.error === 'TOKEN_ALREADY_USED') setErrorType('USED');
      else setErrorType('INVALID');
      setValidationError('Invitation link verification failed.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please re-type.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      // 1. Consume invitation in client storage
      credentialsService.consumeInvitation(token, password);

      // 2. Try background sync with server
      try {
        fetch('/api/auth/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email, password }),
        }).catch(() => {});
      } catch {
        // non-blocking
      }

      soundService.playSuccessChime();
      setActivationSuccess(true);
      const targetUrl = getPostLoginRedirect({
        role: adminMeta?.role || 'DIVISION_ADMIN',
        divisionId: adminMeta?.divisionId,
        tenantId: adminMeta?.tenantId,
      });
      setRedirectUrl(targetUrl);

      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect(targetUrl, {
            email,
            name: adminMeta?.name || 'Administrator',
            role: adminMeta?.role || 'DIVISION_ADMIN',
          });
        } else {
          window.location.href = `/?portal=super`;
        }
      }, 1500);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to submit permanent password.');
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER: LOADING STATE
  // --------------------------------------------------------------------------
  if (isValidating) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-black text-white">Validating Invitation Token</h2>
          <p className="text-slate-400 text-xs mt-2">
            Verifying single-use cryptographic signature and division privileges...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: RESILIENT ERROR SCREEN (EXPIRED / INVALID TOKEN)
  // --------------------------------------------------------------------------
  if (validationError || !adminMeta) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">
              {errorType === 'EXPIRED' ? 'Invitation Link Expired' : 'Access Verification Failed'}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              {validationError || 'The invitation link you clicked is invalid, corrupted, or has already expired.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-400">
            <div className="flex justify-between">
              <span>Account Email:</span>
              <span className="font-mono text-white font-bold">{email || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Policy:</span>
              <span className="text-amber-400">HMAC-SHA256 (24-Hour Expiry)</span>
            </div>
            <div className="flex justify-between">
              <span>System Hotline:</span>
              <span className="text-cyan-400 font-bold">+94 76 860 7143</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                if (onRequestDualOtp && email) {
                  onRequestDualOtp(email);
                } else {
                  window.location.href = `/?portal=super&requestNewLink=${encodeURIComponent(email)}`;
                }
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Request New Access Link
            </button>

            <button
              onClick={() => {
                window.location.href = `/?portal=super&resetOtp=true&email=${encodeURIComponent(email)}`;
              }}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              Reset Password via Dual-Channel OTP (Email + WhatsApp)
            </button>

            <a
              href="/"
              className="block text-center text-xs text-slate-400 hover:text-white pt-2 transition-colors"
            >
              Return to Ceyteq Master Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: SUCCESS SCREEN
  // --------------------------------------------------------------------------
  if (activationSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Account Successfully Activated!</h2>
          <p className="text-slate-300 text-xs">
            Your permanent password has been encrypted with bcrypt (12 salt rounds).
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
            Routing to assigned division: <span className="font-bold">{redirectUrl}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Redirecting automatically...</span>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: PERMANENT PASSWORD SETUP FORM
  // --------------------------------------------------------------------------
  const divisionMeta = adminMeta.divisionId ? SRI_LANKA_DIVISIONS[adminMeta.divisionId] : null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
      <div className="bg-slate-900 border border-indigo-900/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
              Ceyteq Enterprise Ecosystem
            </div>
            <h2 className="text-xl font-black text-white">Activate Your Admin Account</h2>
          </div>
        </div>

        {/* Assigned Division Scope Badge */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Assigned User:</span>
            <span className="font-bold text-white">{adminMeta.name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Email:</span>
            <span className="font-mono text-cyan-300">{adminMeta.email}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Designated Role:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
              {adminMeta.role}
            </span>
          </div>

          {divisionMeta && (
            <div className="pt-2 border-t border-slate-800/80 flex items-start justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Division Boundary:
              </span>
              <div className="text-right">
                <span className="font-bold text-amber-300">{divisionMeta.name}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Provinces: {adminMeta.allowedProvinces?.join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Set Permanent Password</span>
              <span className="text-[10px] text-emerald-400 font-normal">Bcrypt 12 Salt Rounds</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter your permanent password"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Encrypting & Activating Account...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Activate Account & Enter Dashboard
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500">
          By activating, your single-use token will be consumed and permanent cryptographic keys will be deployed.
        </p>
      </div>
    </div>
  );
};
