// ==============================================================================
// CEYTEQ DIGITAL RACE - MULTI-PORTAL LAUNCHER & DEVICE SEPARATION
// Allows running Customer UI, Restaurant Admin, POS/KOT, and Master Admin
// as dedicated standalone portals across different devices in Real-Time!
// ==============================================================================

import React, { useState } from 'react';
import { 
  Smartphone, 
  Store, 
  ChefHat, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Database, 
  Radio, 
  QrCode, 
  X,
  Volume2,
  Tv
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ActiveView, Tenant } from '../types';
import { SUPABASE_SQL_SETUP_SCRIPT } from '../lib/supabaseClient';
import { soundService } from '../lib/audioService';

interface PortalLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTenant: Tenant;
  tableNumber: number;
  onSelectPortal: (view: ActiveView, standalone?: boolean) => void;
  isStandalone: boolean;
  onToggleStandalone: (val: boolean) => void;
}

export const PortalLauncherModal: React.FC<PortalLauncherModalProps> = ({
  isOpen,
  onClose,
  currentTenant,
  tableNumber,
  onSelectPortal,
  isStandalone,
  onToggleStandalone,
}) => {
  const [activeTab, setActiveTab] = useState<'PORTALS' | 'SQL_SETUP'>('PORTALS');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://digitalrace-ceyteq.vercel.app';

  const portals = [
    {
      key: 'portal-public-menu',
      id: 'PUBLIC_MENU' as ActiveView,
      title: 'Customer Mobile Menu (QR Code)',
      badge: 'Table # ' + tableNumber,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Smartphone,
      iconColor: 'text-emerald-500 bg-emerald-50',
      description: 'Clean, mobile-first customer interface with zero admin controls. Customers place orders & call waiter directly from their phones.',
      device: 'Customer Smartphone (QR Scan)',
      url: `${currentOrigin}/?portal=menu&t=${currentTenant.slug || currentTenant.id}&table=${tableNumber}`,
    },
    {
      key: 'portal-client-dashboard',
      id: 'CLIENT_DASHBOARD' as ActiveView,
      title: 'Restaurant Owner & Manager Admin',
      badge: currentTenant.name,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Store,
      iconColor: 'text-blue-500 bg-blue-50',
      description: 'Dedicated restaurant management: Live incoming sales, Menu & Price editor, Table QR generation, Staff management.',
      device: 'Owner Laptop / Manager Tablet',
      url: `${currentOrigin}/?portal=restaurant&t=${currentTenant.slug || currentTenant.id}`,
    },
    {
      key: 'portal-pro-pos',
      id: 'PRO_OPERATIONS' as ActiveView,
      title: 'Kitchen KOT & Live POS Terminal',
      badge: 'Audio Bell Enabled',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: ChefHat,
      iconColor: 'text-amber-500 bg-amber-50',
      description: 'Real-time kitchen order ticket (KOT) screen. Rings kitchen bell whenever an order is submitted from tables. Update status (Preparing -> Ready).',
      device: 'Kitchen Wall Tablet / Cashier Counter',
      url: `${currentOrigin}/?portal=pos&t=${currentTenant.slug || currentTenant.id}`,
    },
    {
      key: 'portal-digital-race-master',
      id: 'SUPER_ADMIN' as ActiveView,
      title: 'Digital Race Platform Master',
      badge: 'Level 2A Master',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      icon: ShieldCheck,
      iconColor: 'text-cyan-500 bg-cyan-50',
      description: 'Central command for Restaurant Management, Onboarding, Subscription Tiers (Free/Plus/Pro), WhatsApp AI & Digital QR Menus.',
      device: 'Digital Race Project Manager',
      url: `${currentOrigin}/?portal=digitalrace&role=DIGITAL_RACE_MASTER&login=true`,
    },
    {
      key: 'portal-tastetrip-master',
      id: 'SUPER_ADMIN' as ActiveView,
      title: 'TasteTrip Delivery Master',
      badge: 'Level 2B Master',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: ShieldCheck,
      iconColor: 'text-rose-500 bg-rose-50',
      description: 'Fleet command for TasteTrip Food Delivery, live courier dispatch, regional delivery zones, driver GPS and commissions.',
      device: 'TasteTrip Project Manager',
      url: `${currentOrigin}/?portal=tastetrip&role=TASTETRIP_MASTER&login=true`,
    },
    {
      key: 'portal-division-admin',
      id: 'SUPER_ADMIN' as ActiveView,
      title: 'Regional Division Admins (8 Districts/Provinces)',
      badge: 'Level 3 RBAC',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      icon: ShieldCheck,
      iconColor: 'text-indigo-500 bg-indigo-50',
      description: 'Geographic partition control for 4 divisions: Up Country, South, Western, and North with localized vendor registration.',
      device: 'Division Admin Laptop / Tablet',
      url: `${currentOrigin}/?portal=division&login=true`,
    },
    {
      key: 'portal-super-master-admin',
      id: 'SUPER_ADMIN' as ActiveView,
      title: 'Ceyteq Root Super Master Admin',
      badge: 'Root System Supervisor',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: ShieldCheck,
      iconColor: 'text-amber-500 bg-amber-50',
      description: 'Global root oversight (info.ceyteq@gmail.com): Multi-tenant architecture, PostgreSQL schemas, payment gateways, and security credentials.',
      device: 'Ceyteq Security Center',
      url: `${currentOrigin}/?portal=super&login=true`,
    },
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#0A192F] to-slate-900 text-white flex items-center justify-between border-b border-sky-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00C8FF]/20 rounded-xl text-[#00C8FF] border border-[#00C8FF]/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Ceyteq Multi-Portal & Real-Time Setup</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Run Customer Menu, Restaurant Admin, Kitchen KOT, and Master Admin separately across multiple devices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => soundService.playOrderBell()}
              title="Test Audio Chime"
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-lg text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#00C8FF]" />
              <span className="hidden sm:inline">Test Bell</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('PORTALS')}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'PORTALS'
                ? 'border-[#00C8FF] text-[#0A192F] bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tv className="w-4 h-4 text-[#00A3D9]" />
            Separate Portals & Device Links
          </button>

          <button
            onClick={() => setActiveTab('SQL_SETUP')}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'SQL_SETUP'
                ? 'border-[#00C8FF] text-[#0A192F] bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-purple-600" />
            Supabase Real Database (SQL Script)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'PORTALS' ? (
            <>
              {/* Standalone Device Mode Toggle Notice */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00C8FF]" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Standalone Screen Mode (Hide Navigation Bar)</h4>
                    <p className="text-[11px] text-slate-600">
                      When placing a tablet at the kitchen or a customer table, enable Standalone Mode so users only see their designated screen.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleStandalone(!isStandalone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isStandalone
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isStandalone ? '✓ Standalone Active' : 'Enable Standalone'}
                </button>
              </div>

              {/* Grid of 4 Portals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portals.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <div
                      key={portal.key}
                      className="border border-slate-200 hover:border-[#00C8FF]/70 rounded-xl p-4 transition-all bg-white hover:shadow-md flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${portal.iconColor}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">{portal.title}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${portal.badgeColor}`}>
                                {portal.badge}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mt-2 mb-3">
                          {portal.description}
                        </p>

                        <div className="text-[10px] text-slate-500 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 mb-3">
                          <span className="font-bold text-slate-700">Recommended Device: </span>
                          {portal.device}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            onSelectPortal(portal.id, true);
                            onClose();
                          }}
                          className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-[#00A3D9] text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>Switch to Portal</span>
                        </button>

                        <button
                          onClick={() => handleCopy(portal.url, portal.key)}
                          title="Copy Direct Device Link"
                          className="p-1.5 border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 rounded-lg transition-colors flex items-center justify-center bg-white"
                        >
                          {copiedLink === portal.key ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <a
                          href={portal.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in New Clean Window"
                          className="p-1.5 border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 rounded-lg transition-colors flex items-center justify-center bg-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile QR Quick Scan Card */}
              <div className="border border-slate-200 bg-slate-50/70 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
                  <QRCodeSVG 
                    value={`${currentOrigin}/?portal=menu&t=${currentTenant.slug || currentTenant.id}&table=${tableNumber}`} 
                    size={90}
                    level="H" 
                  />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    Scan with Mobile Camera to Test Live Customer Ordering
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Open this QR code from your mobile phone. When you place an order or tap "Call Waiter", the Kitchen / POS screen on this laptop will ring a bell in real time!
                  </p>
                  <p className="text-[10px] text-[#00A3D9] font-mono break-all pt-1">
                    {currentOrigin}/?portal=menu&table={tableNumber}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Supabase SQL Database Setup Guide */
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-purple-600 text-white rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-purple-950">Supabase SQL Editor - 1-Click Database Setup</h3>
                  <p className="text-xs text-purple-800 mt-0.5">
                    To persist real orders, food items, tables, and enable live database replication in Supabase, execute this SQL script in your Supabase Dashboard:
                  </p>
                  <ol className="list-decimal list-inside text-xs text-purple-900 mt-2 space-y-1 font-medium">
                    <li>Open your Supabase project: <strong>jhvqliimklxrxdwszzfk</strong></li>
                    <li>Click <strong>SQL Editor</strong> on the left menu</li>
                    <li>Click <strong>New query</strong>, Paste the script below, and click <strong>Run (Ctrl+Enter)</strong></li>
                  </ol>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2 rounded-t-xl text-xs font-mono">
                  <span>supabase_schema_digitalrace.sql</span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-bold transition-colors"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono rounded-b-xl overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
                  {SUPABASE_SQL_SETUP_SCRIPT}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-slate-700">Supabase Realtime Channel: Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 font-bold rounded-lg text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
