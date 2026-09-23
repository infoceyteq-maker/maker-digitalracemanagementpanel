import React, { useState } from 'react';
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
  Bike,
  ShieldAlert,
  Lock,
  UserCheck,
  Menu,
  X,
  Layers,
  CheckCircle2,
  ExternalLink,
  Radio
} from 'lucide-react';
import { ActiveView, Tenant, WaiterRequest, AuthUser } from '../types';
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
  currentUser?: AuthUser | null;
  onOpenAuthModal?: () => void;
  onOpenPortalLauncher?: () => void;
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
  currentUser,
  onOpenAuthModal,
  onOpenPortalLauncher,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentTenant = tenants.find(t => t.id === currentTenantId) || tenants[0];
  const pendingCallsCount = waiterCalls.filter(c => c.status === 'PENDING').length;

  const navigateTo = (view: ActiveView) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100/90 shadow-sm px-3 sm:px-6 py-2 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Brand Logo & Digital Race SaaS Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <CeyteqLogo size="sm" variant="light" showSubtitle={false} />
            <div className="h-5 w-[1px] bg-sky-200 hidden sm:block" />
            <div className="hidden xs:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#00A3D9] tracking-tight uppercase font-mono">Digital Race</span>
                <span className="text-[9px] bg-pink-50 text-pink-700 font-bold px-1.5 py-0.2 rounded border border-pink-200">
                  SAAS
                </span>
              </div>
              <p className="text-[9px] text-slate-500 font-medium hidden sm:block">Multi-Tenant Restaurant Cloud</p>
            </div>
          </div>

          {/* Desktop View Switcher Pills */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar bg-sky-100/70 p-1 rounded-xl border border-sky-200/60 shadow-inner">
            <button
              onClick={() => navigateTo('PUBLIC_MENU')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'PUBLIC_MENU'
                  ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer UI</span>
            </button>

            <button
              onClick={() => navigateTo('CLIENT_DASHBOARD')}
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
              onClick={() => navigateTo('PRO_OPERATIONS')}
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
              onClick={() => navigateTo('TASTE_TRIP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap relative ${
                activeView === 'TASTE_TRIP' || (activeView as any) === 'TASTRIP_DASHBOARD'
                  ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Bike className="w-3.5 h-3.5 text-pink-600" />
              <span>TasTrip Dashboard</span>
            </button>

            <button
              onClick={() => navigateTo('SUPER_ADMIN')}
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
              onClick={() => navigateTo('SECURITY_CENTER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap relative ${
                activeView === 'SECURITY_CENTER'
                  ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Security & 2FA</span>
            </button>

            <button
              onClick={() => navigateTo('ANALYTICS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'ANALYTICS'
                  ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => navigateTo('ARCHITECTURE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'ARCHITECTURE'
                  ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Tech Hub</span>
            </button>
          </div>

          {/* Right Controls: Tenant Selector, Table Picker & Mobile Drawer Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Restaurant Tenant Selector */}
            <div className="flex items-center gap-1 bg-white px-2 sm:px-2.5 py-1.5 rounded-xl border border-sky-200/80 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-[#00A3D9] shrink-0" />
              <select
                value={currentTenantId}
                onChange={(e) => onSelectTenant(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[100px] sm:max-w-[140px] truncate"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id} className="bg-white text-slate-800">
                    {t.name}
                  </option>
                ))}
              </select>
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase shrink-0 ${
                currentTenant.tier === 'PRO' ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                currentTenant.tier === 'PLUS' ? 'bg-sky-100 text-sky-700 border border-sky-200' :
                'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {currentTenant.tier || 'FREE'}
              </span>
            </div>

            {/* Table Selector (When on Customer Menu) */}
            {activeView === 'PUBLIC_MENU' && (
              <div className="flex items-center gap-1 text-xs text-slate-600 bg-white px-2 py-1.5 rounded-xl border border-sky-200/80 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline">Table</span>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(Number(e.target.value))}
                  className="bg-transparent text-xs font-black text-[#00A3D9] focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20].map(n => (
                    <option key={n} value={n} className="bg-white text-slate-800">
                      #{n}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Realtime Portals & Separate Devices Button */}
            {onOpenPortalLauncher && (
              <button
                onClick={onOpenPortalLauncher}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2.5 py-1.5 rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all hover:brightness-105 shrink-0"
                title="Open separate screens for Customer Phone, Kitchen KOT, and Master Admin"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
                <span className="hidden md:inline">Separate Devices</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">Real-Time</span>
              </button>
            )}

            {/* Security Profile / 2FA Status */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-sky-200/80 shadow-2xs transition-all shrink-0"
              title="Manage Security Authentication & 2FA"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#00A3D9]" />
              <span className="text-[10px] font-bold text-slate-800 hidden sm:inline truncate max-w-[80px]">
                {currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-800 border border-sky-200 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-pink-600" /> : <Menu className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-[85%] max-w-xs bg-white h-full shadow-2xl flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <CeyteqLogo size="sm" variant="light" showSubtitle={false} />
                <span className="text-[10px] font-black uppercase text-[#00A3D9] font-mono">Digital Race</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Info in Mobile Drawer */}
            <div className="my-3 p-3 rounded-xl bg-sky-50 border border-sky-200/70">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Restaurant:</div>
              <div className="text-xs font-black text-slate-900 mt-0.5">{currentTenant.name}</div>
              <div className="text-[11px] text-slate-600 font-mono mt-0.5">{currentTenant.subdomain}.ceyteq.com</div>
              <div className="mt-2 flex items-center justify-between pt-2 border-t border-sky-200/60 text-[10px]">
                <span className="text-slate-600">Tier: <strong className="text-pink-600">{currentTenant.tier || 'FREE'}</strong></span>
                <span className="text-slate-600">Table: <strong className="text-[#00A3D9]">#{tableNumber}</strong></span>
              </div>
            </div>

            {/* All Pages Navigation List */}
            <div className="flex-1 space-y-1 py-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Pages & Views</div>
              
              <button
                onClick={() => navigateTo('PUBLIC_MENU')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'PUBLIC_MENU'
                    ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#00A3D9]" />
                  <span>Customer Mobile Menu UI</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/70 font-mono">Dine-in</span>
              </button>

              <button
                onClick={() => navigateTo('CLIENT_DASHBOARD')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'CLIENT_DASHBOARD'
                    ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-pink-600" />
                  <span>Restaurant Admin Dashboard</span>
                </div>
                {pendingCallsCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                    {pendingCallsCount} calls
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateTo('PRO_OPERATIONS')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'PRO_OPERATIONS'
                    ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Pro POS & Kitchen KOT</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                  PRO
                </span>
              </button>

              <button
                onClick={() => navigateTo('TASTE_TRIP')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'TASTE_TRIP' || (activeView as any) === 'TASTRIP_DASHBOARD'
                    ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bike className="w-4 h-4 text-rose-500" />
                  <span>TasTrip Driver Ecosystem</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                  FLEET
                </span>
              </button>

              <button
                onClick={() => navigateTo('SUPER_ADMIN')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'SUPER_ADMIN'
                    ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#0098CC]" />
                  <span>Ceyteq Master Admin</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">
                  MASTER
                </span>
              </button>

              <button
                onClick={() => navigateTo('SECURITY_CENTER')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'SECURITY_CENTER'
                    ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Security & 2FA Engine</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  JWT
                </span>
              </button>

              <button
                onClick={() => navigateTo('ANALYTICS')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'ANALYTICS'
                    ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <span>Analytics & Trends</span>
                </div>
              </button>

              <button
                onClick={() => navigateTo('ARCHITECTURE')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'ARCHITECTURE'
                    ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-slate-700" />
                  <span>Tech Architecture Hub</span>
                </div>
              </button>
            </div>

            {/* Mobile Drawer Footer with Auth Switch */}
            <div className="pt-3 border-t border-sky-100 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <UserCheck className="w-4 h-4 text-[#00C8FF]" />
                <span>{currentUser ? `Manage ${currentUser.role}` : 'Sign In / Authenticate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION DOCK (Persistent on phone screens < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-sky-200/80 px-2 py-1.5 shadow-lg flex items-center justify-around">
        <button
          onClick={() => navigateTo('PUBLIC_MENU')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'PUBLIC_MENU'
              ? 'text-[#00A3D9] font-black scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>

        <button
          onClick={() => navigateTo('CLIENT_DASHBOARD')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
            activeView === 'CLIENT_DASHBOARD'
              ? 'text-pink-600 font-black scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Store className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Admin</span>
          {pendingCallsCount > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => navigateTo('PRO_OPERATIONS')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'PRO_OPERATIONS'
              ? 'text-amber-600 font-black scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">POS/KOT</span>
        </button>

        <button
          onClick={() => navigateTo('SUPER_ADMIN')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'SUPER_ADMIN'
              ? 'text-[#008BB8] font-black scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Master</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-all"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};

