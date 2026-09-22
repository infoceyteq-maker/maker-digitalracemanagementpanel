import React from 'react';
import { 
  Smartphone, 
  Store, 
  ShieldCheck, 
  Code2, 
  Building2, 
  ChevronDown, 
  Bell, 
  Sparkles,
  QrCode,
  BarChart3,
  Bike
} from 'lucide-react';
import { ActiveView, Tenant, WaiterRequest } from '../types';
import { CeyteqLogo } from './CeyteqLogo';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  tenants: Tenant[];
  currentTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  waiterCalls: WaiterRequest[];
  tableNumber: number;
  setTableNumber: (table: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  tenants,
  currentTenantId,
  onSelectTenant,
  waiterCalls,
  tableNumber,
  setTableNumber,
}) => {
  const currentTenant = tenants.find(t => t.id === currentTenantId) || tenants[0];
  const pendingCallsCount = waiterCalls.filter(c => c.status === 'PENDING').length;

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-sky-100/90 shadow-sm px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Agency Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CeyteqLogo size="sm" variant="light" showSubtitle={false} />
            <div className="h-6 w-[1px] bg-sky-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#00A3D9] tracking-tight uppercase font-mono">Digital Race</span>
                <span className="text-[9px] bg-pink-50 text-pink-700 font-bold px-1.5 py-0.2 rounded border border-pink-200">
                  SAAS
                </span>
              </div>
              <p className="text-[9px] text-slate-500 font-medium">Multi-Tenant Restaurant Cloud</p>
            </div>
          </div>

          {/* Mobile tenant picker */}
          <div className="md:hidden">
            <select
              value={currentTenantId}
              onChange={(e) => onSelectTenant(e.target.value)}
              className="bg-white border border-sky-200 rounded-lg px-2 py-1 text-xs text-slate-800 shadow-sm"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-sky-100/70 p-1 rounded-xl border border-sky-200/60 self-start md:self-auto shadow-inner">
          <button
            onClick={() => setActiveView('PUBLIC_MENU')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'PUBLIC_MENU'
                ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Customer Mobile UI</span>
          </button>

          <button
            onClick={() => setActiveView('CLIENT_DASHBOARD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap relative ${
              activeView === 'CLIENT_DASHBOARD'
                ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Restaurant Admin</span>
            {pendingCallsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveView('PRO_OPERATIONS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'PRO_OPERATIONS'
                ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Pro POS & KOT</span>
          </button>

          <button
            onClick={() => setActiveView('TASTE_TRIP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap relative ${
              activeView === 'TASTE_TRIP' || (activeView as any) === 'TASTRIP_DASHBOARD'
                ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Bike className="w-3.5 h-3.5 text-pink-600" />
            <span>TasTrip Dashboard</span>
            <span className="text-[9px] bg-pink-100 text-pink-700 border border-pink-300 px-1 py-0.2 rounded font-mono font-bold">
              SOLUTION
            </span>
          </button>

          <button
            onClick={() => setActiveView('SUPER_ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'SUPER_ADMIN'
                ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#0098CC]" />
            <span>Ceyteq Master Admin</span>
          </button>

          <button
            onClick={() => setActiveView('ANALYTICS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'ANALYTICS'
                ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Trends</span>
          </button>

          <button
            onClick={() => setActiveView('ARCHITECTURE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === 'ARCHITECTURE'
                ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Tech Architecture & Next.js Code</span>
          </button>
        </div>

        {/* Tenant selector on Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-sky-200/80 shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-[#00A3D9]" />
            <select
              value={currentTenantId}
              onChange={(e) => onSelectTenant(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id} className="bg-white text-slate-800">
                  {t.name} [{t.tier || 'FREE'}]
                </option>
              ))}
            </select>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
              currentTenant.tier === 'PRO' ? 'bg-pink-100 text-pink-700 border border-pink-300' :
              currentTenant.tier === 'PLUS' ? 'bg-sky-100 text-sky-700 border border-sky-300' :
              'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {currentTenant.tier || 'FREE'}
            </span>
          </div>

          {activeView === 'PUBLIC_MENU' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded-xl border border-sky-200/80 shadow-sm">
              <span className="text-[11px] font-medium">Table:</span>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-[#00A3D9] focus:outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20].map(n => (
                  <option key={n} value={n} className="bg-white text-slate-800">
                    #{n}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
