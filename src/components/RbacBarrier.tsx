import React from 'react';
import { ShieldAlert, Lock, ArrowUpRight, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { CeyteqLogo } from './CeyteqLogo';
import { SubscriptionTier, UserRole } from '../types';

interface RbacBarrierProps {
  requiredTier?: SubscriptionTier;
  currentTier: SubscriptionTier;
  requiredRole?: UserRole | 'SUPER_ADMIN';
  currentRole?: UserRole;
  featureName: string;
  onUpgrade?: () => void;
  onSwitchUser?: () => void;
  onGoBack: () => void;
}

export const RbacBarrier: React.FC<RbacBarrierProps> = ({
  requiredTier,
  currentTier,
  requiredRole,
  currentRole,
  featureName,
  onUpgrade,
  onSwitchUser,
  onGoBack,
}) => {
  const isTierDeficiency = requiredTier && currentTier !== requiredTier;
  const isRoleDeficiency = requiredRole && currentRole !== requiredRole;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-xl text-center relative overflow-hidden">
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-[#00A3D9]" />

        <div className="flex justify-center mb-4">
          <CeyteqLogo size="sm" variant="light" showSubtitle={false} />
        </div>

        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-mono font-bold mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>RBAC_ACCESS_DENIED: {isRoleDeficiency ? 'ROLE_INSUFFICIENT' : 'TIER_UPGRADE_REQUIRED'}</span>
        </div>

        <h2 className="text-lg font-black text-slate-900">
          Access Restricted: {featureName}
        </h2>

        <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
          {isRoleDeficiency ? (
            <>
              This area is restricted to <strong className="text-slate-800">{requiredRole}</strong> personnel. Your current security role is <span className="font-mono font-bold text-rose-600">{currentRole || 'PUBLIC'}</span>.
            </>
          ) : (
            <>
              {featureName} requires an active <strong className="text-slate-800">{requiredTier} Tier</strong> subscription. Your tenant account is currently on the <span className="font-mono font-bold text-slate-700">{currentTier} Tier</span>.
            </>
          )}
        </p>

        {/* Diagnostic Breakdown Card */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left font-mono text-[11px] text-slate-600 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Current Security Tier:</span>
            <span className="font-bold text-slate-800">{currentTier}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Required Tier:</span>
            <span className="font-bold text-emerald-600">{requiredTier || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Security Middleware Check:</span>
            <span className="text-rose-600 font-bold">403 FORBIDDEN</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Audit Incident ID:</span>
            <span className="text-slate-500">AUDIT-{Math.random().toString(36).substring(2, 9).toUpperCase()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            onClick={onGoBack}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Allowed View</span>
          </button>

          {isTierDeficiency && onUpgrade && (
            <button
              onClick={onUpgrade}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-black transition-all shadow-md"
            >
              <span>Upgrade to {requiredTier}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onSwitchUser && (
            <button
              onClick={onSwitchUser}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A3D9] hover:bg-[#008BB8] text-white text-xs font-bold transition-all shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Switch Role/2FA</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
