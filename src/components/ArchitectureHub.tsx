import React, { useState } from 'react';
import { 
  Code2, 
  Database, 
  FolderTree, 
  Globe, 
  Terminal, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Server, 
  ShieldCheck, 
  Layers, 
  Info,
  CheckCircle2,
  Play
} from 'lucide-react';
import { 
  PRISMA_SCHEMA_CODE, 
  NEXTJS_MIDDLEWARE_CODE, 
  FOLDER_STRUCTURE_TEXT, 
  CUSTOM_DOMAIN_GUIDE 
} from '../architectureDocs';
import { Tenant } from '../types';

interface ArchitectureHubProps {
  tenants: Tenant[];
}

export const ArchitectureHub: React.FC<ArchitectureHubProps> = ({ tenants }) => {
  const [activeTab, setActiveTab] = useState<'MIDDLEWARE' | 'PRISMA' | 'FOLDER_TREE' | 'DNS_GUIDE' | 'SIMULATOR'>('MIDDLEWARE');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Live Middleware Simulator State
  const [simHost, setSimHost] = useState('ceylon-spice.ceyteq.com');
  const [simPath, setSimPath] = useState('/table/4');
  const [simResult, setSimResult] = useState<{
    cleanHost: string;
    resolvedType: string;
    tenantMatch: Tenant | null;
    headerTenantId: string;
    rewriteTarget: string;
    isCustomDomain: boolean;
  } | null>(null);

  const copyCode = (code: string, sectionKey: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Run Middleware Simulation
  const runSimulation = (host: string, path: string) => {
    const cleanHost = host.replace(/:\d+$/, '').toLowerCase();
    const ROOT_DOMAIN = 'ceyteq.com';
    const ADMIN_SUBDOMAIN = `admin.${ROOT_DOMAIN}`;
    const DASHBOARD_SUBDOMAIN = `dashboard.${ROOT_DOMAIN}`;

    let resolvedType = 'MARKETING_LANDING';
    let tenantMatch: Tenant | null = null;
    let headerTenantId = '';
    let rewriteTarget = '';
    let isCustomDomain = false;

    if (cleanHost === ADMIN_SUBDOMAIN || (cleanHost === 'localhost' && path.startsWith('/admin'))) {
      resolvedType = 'SUPER_ADMIN_PANEL';
      rewriteTarget = `/admin${path === '/admin' ? '' : path}`;
    } else if (cleanHost === DASHBOARD_SUBDOMAIN || path.startsWith('/dashboard')) {
      resolvedType = 'TENANT_DASHBOARD';
      rewriteTarget = `/dashboard${path.replace('/dashboard', '')}`;
    } else if (cleanHost === ROOT_DOMAIN || cleanHost === `www.${ROOT_DOMAIN}` || cleanHost === 'localhost') {
      resolvedType = 'AGENCY_MARKETING';
      rewriteTarget = `app/(marketing)/page.tsx (no rewrite)`;
    } else if (cleanHost.endsWith(`.${ROOT_DOMAIN}`)) {
      resolvedType = 'SUBDOMAIN_TENANT_MENU';
      const sub = cleanHost.replace(`.${ROOT_DOMAIN}`, '');
      headerTenantId = sub;
      tenantMatch = tenants.find(t => t.subdomain === sub) || null;
      rewriteTarget = `/[domain]/${sub}${path}`;
      isCustomDomain = false;
    } else {
      resolvedType = 'CUSTOM_DOMAIN_TENANT_MENU';
      headerTenantId = cleanHost;
      tenantMatch = tenants.find(t => t.customDomain?.toLowerCase() === cleanHost) || null;
      rewriteTarget = `/[domain]/${cleanHost}${path}`;
      isCustomDomain = true;
    }

    setSimResult({
      cleanHost,
      resolvedType,
      tenantMatch,
      headerTenantId,
      rewriteTarget,
      isCustomDomain,
    });
  };

  React.useEffect(() => {
    runSimulation(simHost, simPath);
  }, [simHost, simPath, tenants]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-600/30">
                <Code2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Next.js Architecture & Multi-Tenant Blueprint
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production Next.js 15 App Router boilerplate, Prisma multi-tenant schema, and edge subdomain routing for Digital Race by Ceyteq.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Next.js 15 App Router Ready
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('MIDDLEWARE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MIDDLEWARE'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Next.js middleware.ts</span>
          </button>

          <button
            onClick={() => setActiveTab('PRISMA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PRISMA'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Prisma Schema (schema.prisma)</span>
          </button>

          <button
            onClick={() => setActiveTab('FOLDER_TREE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'FOLDER_TREE'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>App Router Folder Tree</span>
          </button>

          <button
            onClick={() => setActiveTab('DNS_GUIDE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DNS_GUIDE'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Custom Domain & DNS Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SIMULATOR'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Live Domain Router Sandbox</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* 1. Next.js Middleware */}
        {activeTab === 'MIDDLEWARE' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Edge Middleware Strategy for Dynamic Subdomains & Custom Domains
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Placed at the root of your Next.js project (`middleware.ts`). Intercepts every HTTP request at the edge, inspects `req.headers.get("host")`, and rewrites to the appropriate route group with zero performance latency.
                </p>
              </div>

              <button
                onClick={() => copyCode(NEXTJS_MIDDLEWARE_CODE, 'middleware')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shrink-0"
              >
                {copiedSection === 'middleware' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'middleware' ? 'Copied to Clipboard!' : 'Copy middleware.ts'}</span>
              </button>
            </div>

            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed shadow-xl">
              <pre>{NEXTJS_MIDDLEWARE_CODE}</pre>
            </div>
          </div>
        )}

        {/* 2. Prisma Schema */}
        {activeTab === 'PRISMA' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  PostgreSQL Prisma Multi-Tenant Schema (`prisma/schema.prisma`)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Features strict tenant isolation with `tenantId` foreign keys, unique slug indexing, custom domain lookup optimization, and bilingual fields (`nameSi`, `descriptionSi`) for Sri Lankan restaurants.
                </p>
              </div>

              <button
                onClick={() => copyCode(PRISMA_SCHEMA_CODE, 'prisma')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shrink-0"
              >
                {copiedSection === 'prisma' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'prisma' ? 'Copied to Clipboard!' : 'Copy schema.prisma'}</span>
              </button>
            </div>

            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed shadow-xl">
              <pre>{PRISMA_SCHEMA_CODE}</pre>
            </div>
          </div>
        )}

        {/* 3. Folder Tree */}
        {activeTab === 'FOLDER_TREE' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-amber-400" />
                  Next.js App Router Architecture: Strict Route Group Separation
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Uses Route Groups `(marketing)`, `(admin)`, `(dashboard)`, and dynamic catch-all route `[domain]` so each area has isolated layouts, authentication middleware, and styling.
                </p>
              </div>

              <button
                onClick={() => copyCode(FOLDER_STRUCTURE_TEXT, 'tree')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shrink-0"
              >
                {copiedSection === 'tree' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'tree' ? 'Copied to Clipboard!' : 'Copy Folder Tree'}</span>
              </button>
            </div>

            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-5 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed shadow-xl">
              <pre>{FOLDER_STRUCTURE_TEXT}</pre>
            </div>
          </div>
        )}

        {/* 4. DNS Guide */}
        {activeTab === 'DNS_GUIDE' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Custom Domain Workflow: Zero Downtime & Auto SSL
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-xs mb-3">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-white">Client Adds DNS Record</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Restaurant owner creates a CNAME record at their registrar (e.g. GoDaddy, Cloudflare, LK Domain Registry) pointing to <strong className="text-slate-200 font-mono">cname.ceyteq.com</strong>.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center font-bold text-xs mb-3">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-white">Cloudflare / Vercel SSL</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Your backend triggers Cloudflare for SaaS or Vercel Domains API. An auto-renewing SSL certificate is generated within seconds.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs mb-3">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-white">Edge Middleware Rewrite</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    When a guest opens <strong className="text-cyan-400 font-mono">menu.ceylonspice.com</strong>, Next.js Middleware maps it directly to the tenant's digital menu without redirecting.
                  </p>
                </div>
              </div>
            </div>

            {/* Step by Step Code Guide */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-3">
                Server-Side DNS Verification Helper (`lib/dns-check.ts`)
              </h4>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <pre>{`// lib/dns-check.ts
import dns from "dns/promises";

export async function verifyCnameRecord(customDomain: string, expectedTarget: string = "cname.ceyteq.com"): Promise<boolean> {
  try {
    const records = await dns.resolveCname(customDomain);
    return records.some(target => target.toLowerCase() === expectedTarget.toLowerCase());
  } catch (error) {
    // If domain has no CNAME or NXDOMAIN
    return false;
  }
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* 5. Live Router Simulator */}
        {activeTab === 'SIMULATOR' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                <Play className="w-5 h-5 text-rose-500" />
                Live Next.js Edge Middleware Router Sandbox
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Type in any incoming Host header or URL to test how the middleware logic routes requests between Super Admin, Restaurant Dashboard, Subdomains, and Custom Domains.
              </p>

              {/* Quick Presets */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-400 block mb-2">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Subdomain: Ceylon Spice', host: 'ceylon-spice.ceyteq.com', path: '/table/4' },
                    { label: 'Custom Domain: Ocean Colombo', host: 'menu.theocean.lk', path: '/' },
                    { label: 'Super Admin: Ceyteq Admin', host: 'admin.ceyteq.com', path: '/tenants' },
                    { label: 'Tenant Dashboard: Client Login', host: 'dashboard.ceyteq.com', path: '/menu' },
                    { label: 'Marketing Root: Ceyteq Agency', host: 'ceyteq.com', path: '/' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSimHost(p.host);
                        setSimPath(p.path);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-mono border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
                <div className="sm:col-span-8">
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Incoming Host Header (`req.headers.get("host")`)
                  </label>
                  <input
                    type="text"
                    value={simHost}
                    onChange={(e) => setSimHost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-xs font-medium text-slate-400 block mb-1">
                    Pathname (`req.nextUrl.pathname`)
                  </label>
                  <input
                    type="text"
                    value={simPath}
                    onChange={(e) => setSimPath(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Simulation Result Box */}
              {simResult && (
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Middleware Execution Trace
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-rose-400 border border-slate-700">
                      {simResult.resolvedType}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500">1. Clean Host:</span>
                        <p className="text-slate-200 font-bold">{simResult.cleanHost}</p>
                      </div>

                      <div>
                        <span className="text-slate-500">2. Tenant Identifier:</span>
                        <p className="text-cyan-400 font-bold">{simResult.headerTenantId || 'None (Agency/Admin Route)'}</p>
                      </div>

                      <div>
                        <span className="text-slate-500">3. Custom Domain Flag:</span>
                        <p className="text-slate-300">{simResult.isCustomDomain ? 'true (x-is-custom-domain = 1)' : 'false (subdomain)'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500">4. Internal Next.js Rewrite Target:</span>
                        <p className="text-rose-400 font-bold bg-rose-950/40 p-2 rounded-lg border border-rose-900/60 break-all">
                          NextResponse.rewrite({simResult.rewriteTarget})
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500">5. Database Tenant Matched:</span>
                        <p className="text-emerald-400 font-bold">
                          {simResult.tenantMatch ? `✓ ${simResult.tenantMatch.name} (${simResult.tenantMatch.id})` : (simResult.headerTenantId ? '⚠️ Tenant not found in DB' : 'N/A')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
