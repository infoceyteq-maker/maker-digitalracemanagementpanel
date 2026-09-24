// ==============================================================================
// CEYTEQ — ROLE + BRANCH AWARE DASHBOARD SIDEBAR
// Target Path: /src/components/DashboardSidebar.tsx
//
// • Navigation links are filtered by the actor's role AND platform branch, so a
//   Digital Race master never sees TasteTrip links (and vice versa).
// • "System Maintenance" is rendered ONLY for the SUPER_MASTER_ADMIN and calls
//   the two guarded endpoints:
//     POST /api/super/reset-management-password
//     POST /api/super/clear-demo-data
// ==============================================================================

import React, { useState } from 'react';
import {
  Store,
  ChefHat,
  Bike,
  ShieldCheck,
  BarChart3,
  Boxes,
  ShieldAlert,
  Wrench,
  KeyRound,
  Trash2,
  Loader2,
} from 'lucide-react';
import { ActiveView, AuthUser } from '../types';
import { canUserAccessView, isSuperMaster, resolveActorBranch } from '../lib/branchScope';

/** Storage key holding the server-issued session token captured at login. */
export const BEARER_TOKEN_KEY = 'ceyteq_bearer_token';

interface SidebarLink {
  view: ActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Branch the link belongs to — 'ALL' renders for every branch. */
  branch: 'ALL' | 'DIGITAL_RACE' | 'TASTETRIP';
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { view: 'CLIENT_DASHBOARD', label: 'Restaurant Admin', icon: Store, branch: 'DIGITAL_RACE' },
  { view: 'PRO_OPERATIONS', label: 'Pro POS & KOT', icon: ChefHat, branch: 'DIGITAL_RACE' },
  { view: 'ANALYTICS', label: 'Analytics', icon: BarChart3, branch: 'DIGITAL_RACE' },
  { view: 'TASTE_TRIP', label: 'TasteTrip Fleet', icon: Bike, branch: 'TASTETRIP' },
  { view: 'SUPER_ADMIN', label: 'Master Console', icon: ShieldCheck, branch: 'ALL' },
  { view: 'ARCHITECTURE', label: 'Architecture', icon: Boxes, branch: 'ALL' },
  { view: 'SECURITY_CENTER', label: 'Security Center', icon: ShieldAlert, branch: 'ALL' },
];

/**
 * Calls a guarded /api/super/* endpoint. The server requires a REAL session, so
 * we send the stored bearer token AND the session cookie (same-origin).
 */
async function callSuperEndpoint(path: string, body?: Record<string, unknown>) {
  const token = typeof window !== 'undefined' ? localStorage.getItem(BEARER_TOKEN_KEY) : null;

  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data as { message?: string } & Record<string, unknown>;
}

interface DashboardSidebarProps {
  currentUser?: AuthUser | null;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentUser,
  activeView,
  setActiveView,
}) => {
  const [busy, setBusy] = useState<null | 'RESET' | 'CLEAR'>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const branch = resolveActorBranch(currentUser);
  const superOnly = isSuperMaster(currentUser.role);
  const links = SIDEBAR_LINKS.filter(
    (link) => link.branch === 'ALL' || canUserAccessView(currentUser, link.view),
  );

  const runMaintenance = async (kind: 'RESET' | 'CLEAR') => {
    setBusy(kind);
    setFeedback(null);
    try {
      const data =
        kind === 'RESET'
          ? await callSuperEndpoint('/api/super/reset-management-password')
          : await callSuperEndpoint('/api/super/clear-demo-data');
      setFeedback({ ok: true, text: data?.message || 'Maintenance action completed.' });
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : 'Maintenance action failed.',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <aside className="w-full lg:w-60 shrink-0 bg-white/80 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-sky-100">
      <div className="p-4 lg:sticky lg:top-4 space-y-4">
        {/* Actor identity + branch badge */}
        <div className="px-3 py-2.5 rounded-xl bg-slate-900 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 truncate">
            {currentUser.role}
          </p>
          <p className="text-[11px] text-slate-300 truncate">{currentUser.email}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-black tracking-wider text-cyan-200">
            {branch === 'ALL' ? 'ALL BRANCHES' : branch.replace('_', ' ')}
          </span>
        </div>

        {/* Branch-scoped navigation */}
        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              activeView === link.view ||
              (link.view === 'TASTE_TRIP' && (activeView as string) === 'TASTRIP_DASHBOARD');
            return (
              <button
                key={link.view}
                onClick={() => setActiveView(link.view)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* SYSTEM MAINTENANCE — SUPER MASTER ADMIN ONLY */}
        {superOnly && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-800">
              <Wrench className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                System Maintenance
              </span>
            </div>

            <button
              onClick={() => runMaintenance('RESET')}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[11px] font-bold transition-all"
            >
              {busy === 'RESET' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>Reset Management Password</span>
            </button>

            <button
              onClick={() => runMaintenance('CLEAR')}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-[11px] font-bold transition-all"
            >
              {busy === 'CLEAR' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Clear Demo Data</span>
            </button>

            {feedback && (
              <p
                className={`text-[10px] leading-relaxed font-semibold ${
                  feedback.ok ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {feedback.text}
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;
