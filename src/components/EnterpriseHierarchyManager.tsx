import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  Building2, 
  Truck, 
  MapPin, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Edit3, 
  UserPlus, 
  Lock, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  ChevronDown
} from 'lucide-react';
import { 
  credentialsService, 
  EnterpriseAdminRecord 
} from '../lib/credentialsService';
import { 
  DivisionId, 
  SriLankanProvince, 
  PlatformBranch, 
  SRI_LANKA_DIVISIONS, 
  PROVINCE_NAMES 
} from '../lib/rbacMatrix';
import { resolveActorBranch } from '../lib/branchScope';

interface EnterpriseHierarchyManagerProps {
  onImpersonateUser?: (admin: EnterpriseAdminRecord) => void;
  onOpenSuperResetModal?: () => void;
}

export const EnterpriseHierarchyManager: React.FC<EnterpriseHierarchyManagerProps> = ({
  onImpersonateUser,
  onOpenSuperResetModal,
}) => {
  const [creds, setCreds] = useState(() => credentialsService.getCredentials());
  const [admins, setAdmins] = useState<EnterpriseAdminRecord[]>(() => credentialsService.getEnterpriseAdmins());
  
  // UI filter tabs (the branch filter state is declared below, once the
  // session role is known, so it can be LOCKED to the actor's own branch)
  
  // Visibility toggles for passwords
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit / Add modal state
  const [editingAdmin, setEditingAdmin] = useState<EnterpriseAdminRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuperEditOpen, setIsSuperEditOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [useProductionUrl, setUseProductionUrl] = useState(true);
  
  // Root Super Master Admin edit state
  const [superPhone, setSuperPhone] = useState(creds.superAdminPhone);
  const [superPass, setSuperPass] = useState(creds.superAdminPassword);
  const [showSuperPass, setShowSuperPass] = useState(false);

  // Admin form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formBranch, setFormBranch] = useState<PlatformBranch>('DIGITAL_RACE');
  const [formRole, setFormRole] = useState<'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN'>('DIVISION_ADMIN');
  const [formDivision, setFormDivision] = useState<DivisionId>('UP_COUNTRY');
  const [formProvinces, setFormProvinces] = useState<SriLankanProvince[]>(['CENTRAL', 'UVA', 'SABARAGAMUWA']);
  const [canProvisionTenants, setCanProvisionTenants] = useState(true);
  const [canResetCredentials, setCanResetCredentials] = useState(true);
  const [canManageFleet, setCanManageFleet] = useState(false);
  const [canConfigureAddons, setCanConfigureAddons] = useState(false);
  const [canAccessGlobalConfig, setCanAccessGlobalConfig] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeInvitation, setActiveInvitation] = useState<{
    email: string;
    name: string;
    activationUrl: string;
    expiresAt: number;
    token: string;
  } | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Current session identity (client-side RBAC context for which actions to show)
  const sessionUser = credentialsService.getCurrentSessionUser() as
    | (EnterpriseAdminRecord & { role?: string })
    | null;
  const currentRole = ((sessionUser as any)?.role || '').toUpperCase();
  // HIERARCHY RULE (mirrored from server): DELETE admins/divisions = SUPER MASTER ONLY
  const canDeleteAdmins = currentRole === 'SUPER_MASTER_ADMIN' || currentRole === 'SUPER_ADMIN';
  const canApproveDivision =
    currentRole === 'SUPER_MASTER_ADMIN' ||
    currentRole === 'SUPER_ADMIN' ||
    currentRole === 'DIGITAL_RACE_MASTER' ||
    currentRole === 'TASTETRIP_MASTER';

  // -------------------------------------------------------------------------
  // BRANCH ISOLATION: the branch filter is LOCKED to the actor's own platform
  // branch. A Digital Race master can never flip the console over to TasteTrip
  // rows (and vice versa). Only the Super Master Admin gets a free selector.
  // -------------------------------------------------------------------------
  const actorBranch = resolveActorBranch({ role: currentRole });
  const isBranchLocked = actorBranch !== 'ALL';
  const [selectedBranch, setSelectedBranch] = useState<'ALL' | 'DIGITAL_RACE' | 'TASTETRIP'>(
    isBranchLocked ? (actorBranch as 'DIGITAL_RACE' | 'TASTETRIP') : 'ALL',
  );

  // Format an ISO timestamp into the Asia/Colombo (SLST, UTC+5:30) wall-clock display
  const formatColombo = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Colombo',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(d);
    } catch {
      return iso;
    }
  };

  // Pull the authoritative admin list from the server (phones, statuses, approvals)
  // and merge it into the local credentials registry that drives the cards.
  const syncFromServer = async () => {
    try {
      const res = await fetch('/api/admins', {
        headers: { 'x-client-role': currentRole || 'SUPER_MASTER_ADMIN' },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.success || !Array.isArray(data.admins)) return;
      const local = credentialsService.getEnterpriseAdmins();
      let touched = false;
      for (const sa of data.admins) {
        const match = local.find((a) => a.email.toLowerCase() === String(sa.email || '').toLowerCase());
        if (match) {
          const next: EnterpriseAdminRecord = {
            ...match,
            phone: sa.phone || match.phone,
            status: (sa.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : match.status) as EnterpriseAdminRecord['status'],
            createdAt: sa.createdAt || match.createdAt,
          };
          if (JSON.stringify(next) !== JSON.stringify(match)) {
            credentialsService.upsertEnterpriseAdmin(next);
            touched = true;
          }
        }
      }
      if (touched) setAdmins(credentialsService.getEnterpriseAdmins());
    } catch {
      // offline — keep local registry
    }
  };

  useEffect(() => {
    void syncFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HIERARCHY RULE: DELETE of an admin/division record → SUPER_MASTER_ADMIN only
  const handleDeleteAdmin = async (admin: EnterpriseAdminRecord) => {
    const ok = window.confirm(
      `DELETE ${admin.name} (${admin.email})?\n\nThis action is reserved for the Super Master Admin and cannot be undone.`
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/admins/${encodeURIComponent(admin.id)}`, {
        method: 'DELETE',
        headers: { 'x-client-role': currentRole || '' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showNotification(`⛔ ${data.error || 'Delete blocked'} ${data.code ? `[${data.code}]` : ''}`);
        return;
      }
      credentialsService.deleteEnterpriseAdmin(admin.id);
      setAdmins(credentialsService.getEnterpriseAdmins());
      showNotification(`🗑️ ${admin.name} deleted by Super Master.`);
    } catch {
      showNotification('⚠️ Could not reach the server — delete not applied.');
    }
  };

  // HIERARCHY RULE: approve a PENDING_APPROVAL division account (Super/branch master)
  const handleApproveAdmin = async (admin: EnterpriseAdminRecord) => {
    try {
      const res = await fetch(`/api/admins/${encodeURIComponent(admin.id)}/approve`, {
        method: 'POST',
        headers: { 'x-client-role': currentRole || '' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showNotification(`⛔ ${data.error || 'Approval blocked'} ${data.code ? `[${data.code}]` : ''}`);
        return;
      }
      const updated = { ...admin, status: 'ACTIVE' as EnterpriseAdminRecord['status'] };
      credentialsService.upsertEnterpriseAdmin(updated);
      setAdmins(credentialsService.getEnterpriseAdmins());
      showNotification(`✅ ${admin.name} approved — status now ACTIVE.`);
    } catch {
      showNotification('⚠️ Could not reach the server — approval not applied.');
    }
  };

  const handleGenerateInviteLink = async (admin: {
    email: string;
    name: string;
    role: string;
    platformBranch?: any;
    division?: any;
    allowedProvinces?: any;
  }) => {
    setIsGeneratingInvite(true);
    try {
      // 1. Generate client-safe cryptographic single-use invitation record
      const clientInvite = credentialsService.createInvitationRecord({
        email: admin.email,
        name: admin.name,
        role: admin.role,
        branch: admin.platformBranch || 'DIGITAL_RACE',
        divisionId: admin.division || null,
        allowedProvinces: admin.allowedProvinces || [],
      });

      // Try background sync with server if available (never throw on failure)
      try {
        fetch('/api/auth/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: admin.email,
            name: admin.name,
            role: admin.role,
            branch: admin.platformBranch || 'DIGITAL_RACE',
            divisionId: admin.division || null,
            allowedProvinces: admin.allowedProvinces || [],
          }),
        }).catch(() => {});
      } catch {
        // background sync non-blocking
      }

      setActiveInvitation({
        email: admin.email,
        name: admin.name,
        activationUrl: clientInvite.activationUrl,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        token: clientInvite.token,
      });

      if (navigator.clipboard) {
        navigator.clipboard.writeText(clientInvite.activationUrl).catch(() => {});
      }
      showNotification(`✨ 24h Activation Link generated & copied for ${admin.name}!`);
    } catch (err: any) {
      showNotification(`⚠️ Unable to generate invitation: ${err?.message || 'Error'}`);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  // Open modal for editing existing admin
  const handleEditAdmin = (admin: EnterpriseAdminRecord) => {
    setEditingAdmin(admin);
    setFormName(admin.name);
    setFormEmail(admin.email);
    setFormPhone(admin.phone);
    setFormPassword(admin.password);
    setFormBranch(admin.platformBranch);
    setFormRole(admin.role as any);
    setFormDivision(admin.division || 'WESTERN');
    setFormProvinces(admin.allowedProvinces);
    setCanProvisionTenants(admin.permissions.canProvisionTenants);
    setCanResetCredentials(admin.permissions.canResetCredentials);
    setCanManageFleet(admin.permissions.canManageFleet);
    setCanConfigureAddons(admin.permissions.canConfigureAddons);
    setCanAccessGlobalConfig(admin.permissions.canAccessGlobalConfig);
    setIsModalOpen(true);
  };

  // Open modal for creating new admin
  const handleCreateNewAdmin = (branch: PlatformBranch, role: 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN') => {
    setEditingAdmin(null);
    setFormBranch(branch);
    setFormRole(role);
    setFormDivision('UP_COUNTRY');
    setFormProvinces(SRI_LANKA_DIVISIONS.UP_COUNTRY.provinces);
    setFormName(role === 'DIVISION_ADMIN' ? 'New Regional Division Admin' : `${branch === 'DIGITAL_RACE' ? 'Digital Race' : 'TasteTrip'} Master Admin`);
    setFormEmail(`admin.${Date.now().toString().slice(-4)}@ceyteq.com`);
    setFormPhone('+94770000000');
    setFormPassword(`Ceyteq@${Math.floor(1000 + Math.random() * 9000)}!`);
    setCanProvisionTenants(true);
    setCanResetCredentials(true);
    setCanManageFleet(branch === 'TASTETRIP');
    setCanConfigureAddons(role !== 'DIVISION_ADMIN');
    setCanAccessGlobalConfig(role !== 'DIVISION_ADMIN');
    setIsModalOpen(true);
  };

  // When division is changed in form, auto-sync provinces
  const handleDivisionChange = (div: DivisionId) => {
    setFormDivision(div);
    setFormProvinces(SRI_LANKA_DIVISIONS[div].provinces);
  };

  // Toggle province checkbox
  const toggleProvince = (prov: SriLankanProvince) => {
    setFormProvinces((prev) =>
      prev.includes(prov) ? prev.filter((p) => p !== prov) : [...prev, prov]
    );
  };

  // Save admin (local registry + server mirror with hierarchy approval rule)
  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formName || !formPassword) return;

    // HIERARCHY RULE (mirrored from server): Division add/edit requires Super
    // Master or Branch Master approval → otherwise PENDING_APPROVAL.
    const isDivision = formRole === 'DIVISION_ADMIN';
    const branchMatch =
      (currentRole === 'DIGITAL_RACE_MASTER' && formBranch === 'DIGITAL_RACE') ||
      (currentRole === 'TASTETRIP_MASTER' && formBranch === 'TASTETRIP');
    const approvedNow = !isDivision || canApproveDivision || branchMatch;

    const updated: EnterpriseAdminRecord = {
      id: editingAdmin ? editingAdmin.id : `adm-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.toLowerCase().trim(),
      phone: formPhone.trim(),
      password: formPassword.trim(),
      role: formRole,
      platformBranch: formBranch,
      division: formRole === 'DIVISION_ADMIN' ? formDivision : undefined,
      allowedProvinces: formRole === 'DIVISION_ADMIN' ? formProvinces : [
        'CENTRAL', 'UVA', 'SABARAGAMUWA', 'SOUTHERN', 'EASTERN', 'WESTERN', 'NORTH_WESTERN', 'NORTHERN', 'NORTH_CENTRAL'
      ],
      permissions: {
        canProvisionTenants,
        canResetCredentials,
        canManageFleet,
        canConfigureAddons,
        canAccessGlobalConfig,
      },
      status: approvedNow ? 'ACTIVE' : 'PENDING_APPROVAL',
      createdAt: editingAdmin ? editingAdmin.createdAt : new Date().toISOString(),
    };

    credentialsService.upsertEnterpriseAdmin(updated);
    setAdmins(credentialsService.getEnterpriseAdmins());
    setIsModalOpen(false);
    showNotification(
      approvedNow
        ? `✅ Successfully saved credentials for ${updated.name}!`
        : `⏳ ${updated.name} saved as PENDING_APPROVAL — Super Master / Branch Master must approve.`
    );

    // Server mirror (never throws; hierarchy rule enforced server-side too)
    const payload = {
      email: updated.email,
      name: updated.name,
      password: updated.password,
      phone: updated.phone,
      role: updated.role,
      division: updated.division || undefined,
      platformBranch: updated.platformBranch,
    };
    const headers = {
      'Content-Type': 'application/json',
      'x-client-role': currentRole || '',
    };
    fetch(editingAdmin ? `/api/admins/${encodeURIComponent(updated.id)}` : '/api/admins', {
      method: editingAdmin ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify(payload),
    })
      .then((r) => r.json().catch(() => null))
      .then((data) => {
        if (data && data.admin?.status === 'PENDING_APPROVAL') {
          const pending = { ...updated, status: 'PENDING_APPROVAL' as EnterpriseAdminRecord['status'] };
          credentialsService.upsertEnterpriseAdmin(pending);
          setAdmins(credentialsService.getEnterpriseAdmins());
          showNotification(`⏳ ${updated.name} is PENDING_APPROVAL on the server.`);
        }
      })
      .catch(() => {/* offline — local registry already updated */});
  };

  // Save Super Master Admin settings
  const handleSaveSuperAdmin = () => {
    credentialsService.setSuperAdminPassword(superPass);
    credentialsService.setSuperAdminPhone(superPhone);
    setCreds(credentialsService.getCredentials());
    setIsSuperEditOpen(false);
    showNotification('👑 Root Super Master Admin credentials updated successfully!');
  };

  // Filtered lists
  const digitalRaceMaster = admins.find((a) => a.role === 'DIGITAL_RACE_MASTER');
  const tasteTripMaster = admins.find((a) => a.role === 'TASTETRIP_MASTER');

  const digitalRaceDivisionAdmins = admins.filter(
    (a) => a.platformBranch === 'DIGITAL_RACE' && a.role === 'DIVISION_ADMIN'
  );
  const tasteTripDivisionAdmins = admins.filter(
    (a) => a.platformBranch === 'TASTETRIP' && a.role === 'DIVISION_ADMIN'
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 lg:p-8 text-white border border-indigo-800/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Unified Enterprise Management Console
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Ceyteq Role-Based Access Control & Geographic Hierarchy
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
              Super Master Admin එක් තැනකින් Login වී පළමුව Branch Master Admin දෙදෙනාද, ඉන්පසු 
              ප්‍රාදේශීය Division Admin 8 දෙනාද සකස් කර (Separate Usernames, Passwords, Permissions) 
              සම්පූර්ණ පද්ධතිය කළමනාකරණය කරන්න.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsLinksModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Official Login Links & Portals</span>
            </button>
            <button
              onClick={() => {
                const summary = admins.map(a => 
                  `[${a.role}] ${a.name}\nEmail: ${a.email}\nPhone: ${a.phone}\nPassword: ${a.password}\nProvinces: ${a.allowedProvinces.join(', ')}\n`
                ).join('\n---\n');
                copyToClipboard(summary, 'all-creds');
                showNotification('📋 All Enterprise Credentials copied to clipboard!');
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2"
            >
              {copiedId === 'all-creds' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              Copy All Management Credentials
            </button>
            <button
              onClick={() => setIsSuperEditOpen(!isSuperEditOpen)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Super Master Credentials
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PLATFORM BRANCH FILTER — locked to the actor's own branch           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          Platform Branch Filter
        </span>
        {(['ALL', 'DIGITAL_RACE', 'TASTETRIP'] as const).map((branch) => {
          const isLockedOut = isBranchLocked && branch !== actorBranch;
          const isActive = selectedBranch === branch;
          return (
            <button
              key={branch}
              type="button"
              disabled={isLockedOut}
              onClick={() => setSelectedBranch(branch)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                isActive
                  ? 'bg-[#00C8FF] text-[#0A192F] border-[#00C8FF]'
                  : isLockedOut
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-[#00C8FF] hover:text-[#0098CC]'
              }`}
            >
              {branch === 'ALL' ? 'All Branches' : branch.replace('_', ' ')}
            </button>
          );
        })}
        {isBranchLocked && (
          <span className="text-[10px] font-bold text-amber-600">
            🔒 Locked to your branch ({actorBranch.replace('_', ' ')})
          </span>
        )}
      </div>

      {/* ==================================================================== */}
      {/* LEVEL 1: SUPER MASTER ADMIN (ROOT SYSTEM SUPERVISOR)                 */}
      {/* ==================================================================== */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border-2 border-amber-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs">
                  LEVEL 1: ROOT SUPERVISOR
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active / Root Authority
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">Super Master Admin (info.ceyteq@gmail.com)</h2>
              <p className="text-slate-400 text-xs mt-1">
                Global root supervisor with unrestricted read/write/delete bypass across all databases, sub-systems, branches, and regional divisions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Root Email</span>
              <span className="text-white font-mono font-semibold">{creds.superAdminEmail}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Master Phone</span>
              <span className="text-white font-mono font-semibold">{creds.superAdminPhone}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Root Password</span>
                <span className="text-amber-300 font-mono font-bold">
                  {showSuperPass ? creds.superAdminPassword : '••••••••••••'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSuperPass(!showSuperPass)}
                  className="p-1 hover:text-white text-slate-400 transition-colors"
                  title="Toggle visibility"
                >
                  {showSuperPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => copyToClipboard(creds.superAdminPassword, 'super-pass')}
                  className="p-1 hover:text-white text-slate-400 transition-colors"
                  title="Copy password"
                >
                  {copiedId === 'super-pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Super Admin Inline Edit Drawer */}
        {isSuperEditOpen && (
          <div className="mt-5 pt-5 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" />
              Update Root Super Master Admin Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Master Mobile (+94...)</label>
                <input
                  type="text"
                  value={superPhone}
                  onChange={(e) => setSuperPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Master Password</label>
                <input
                  type="text"
                  value={superPass}
                  onChange={(e) => setSuperPass(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsSuperEditOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSuperAdmin}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Commit Root Updates
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs for Platform Vertical */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedBranch('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedBranch === 'ALL'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Complete Ecosystem (All Verticals)
          </button>
          <button
            onClick={() => setSelectedBranch('DIGITAL_RACE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedBranch === 'DIGITAL_RACE'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Vertical A: Digital Race (Restaurants)
          </button>
          <button
            onClick={() => setSelectedBranch('TASTETRIP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedBranch === 'TASTETRIP'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Vertical B: TasteTrip (Food Delivery)
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-white font-bold">{admins.length}</span> Active Management Accounts
        </div>
      </div>

      {/* ==================================================================== */}
      {/* LEVEL 2: 2 BRANCH MASTER ADMINS                                      */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            STEP 1: LEVEL 2 BRANCH MASTER ADMINS (Master Admin දෙදෙනා)
          </h3>
          <span className="text-xs text-slate-400">Supervise and provision their respective 4 Regional Division Admins</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vertical A: Digital Race Master Admin */}
          {(selectedBranch === 'ALL' || selectedBranch === 'DIGITAL_RACE') && digitalRaceMaster && (
            <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-2xl p-5 shadow-lg relative group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                      Level 2A • Branch Master
                    </span>
                    <h4 className="text-lg font-black text-white">{digitalRaceMaster.name}</h4>
                    <p className="text-slate-400 text-xs">Digital Menu & Restaurant Platform Supervisor</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditAdmin(digitalRaceMaster)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {/* Credentials Box */}
              <div className="mt-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Username / Email:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{digitalRaceMaster.email}</span>
                    <button
                      onClick={() => copyToClipboard(digitalRaceMaster.email, 'dr-email')}
                      className="p-1 hover:text-cyan-400 text-slate-500"
                    >
                      {copiedId === 'dr-email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Mobile Phone:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{digitalRaceMaster.phone}</span>
                    <button
                      onClick={() => copyToClipboard(digitalRaceMaster.phone, 'dr-phone')}
                      className="p-1 hover:text-cyan-400 text-slate-500"
                    >
                      {copiedId === 'dr-phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-300 font-bold">
                      {visiblePasswords[digitalRaceMaster.id] ? digitalRaceMaster.password : '••••••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(digitalRaceMaster.id)}
                      className="p-1 hover:text-cyan-400 text-slate-500"
                    >
                      {visiblePasswords[digitalRaceMaster.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(digitalRaceMaster.password, 'dr-pass')}
                      className="p-1 hover:text-cyan-400 text-slate-500"
                    >
                      {copiedId === 'dr-pass' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions list */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">Granted Authorities</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">Manage Digital Race Platform</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">Tier Limits (Free/Plus/Pro)</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">AI Chatbot & WhatsApp Addons</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">Supervise 4 Division Admins</span>
                </div>
              </div>
            </div>
          )}

          {/* Vertical B: TasteTrip Master Admin */}
          {(selectedBranch === 'ALL' || selectedBranch === 'TASTETRIP') && tasteTripMaster && (
            <div className="bg-slate-900 border-2 border-rose-500/40 rounded-2xl p-5 shadow-lg relative group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                      Level 2B • Branch Master
                    </span>
                    <h4 className="text-lg font-black text-white">{tasteTripMaster.name}</h4>
                    <p className="text-slate-400 text-xs">Food Delivery & Fleet Operations Supervisor</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditAdmin(tasteTripMaster)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {/* Credentials Box */}
              <div className="mt-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Username / Email:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{tasteTripMaster.email}</span>
                    <button
                      onClick={() => copyToClipboard(tasteTripMaster.email, 'tt-email')}
                      className="p-1 hover:text-rose-400 text-slate-500"
                    >
                      {copiedId === 'tt-email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Mobile Phone:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{tasteTripMaster.phone}</span>
                    <button
                      onClick={() => copyToClipboard(tasteTripMaster.phone, 'tt-phone')}
                      className="p-1 hover:text-rose-400 text-slate-500"
                    >
                      {copiedId === 'tt-phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-300 font-bold">
                      {visiblePasswords[tasteTripMaster.id] ? tasteTripMaster.password : '••••••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(tasteTripMaster.id)}
                      className="p-1 hover:text-rose-400 text-slate-500"
                    >
                      {visiblePasswords[tasteTripMaster.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(tasteTripMaster.password, 'tt-pass')}
                      className="p-1 hover:text-rose-400 text-slate-500"
                    >
                      {copiedId === 'tt-pass' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions list */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">Granted Authorities</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">Manage TasteTrip Fleet</span>
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">Delivery Dispatching</span>
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">Regional Delivery Zones</span>
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">Supervise 4 Division Admins</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* LEVEL 3: 8 REGIONAL DIVISION ADMINS (4 PER PLATFORM VERTICAL)        */}
      {/* ==================================================================== */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              STEP 2: LEVEL 3 REGIONAL DIVISION ADMINS (ප්‍රාදේශීය කොට්ඨාශ කළමනාකරුවන් 8 දෙනා)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sri Lanka is partitioned into 4 Divisions (Up Country, South, Western, North). Each platform has dedicated Division Admins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCreateNewAdmin('DIGITAL_RACE', 'DIVISION_ADMIN')}
              className="px-3.5 py-2 bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Digital Race Admin
            </button>
            <button
              onClick={() => handleCreateNewAdmin('TASTETRIP', 'DIVISION_ADMIN')}
              className="px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 text-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add TasteTrip Admin
            </button>
          </div>
        </div>

        {/* Section A: Digital Race Division Admins */}
        {(selectedBranch === 'ALL' || selectedBranch === 'DIGITAL_RACE') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              Digital Race • 4 Regional Division Admins (Restaurants & Digital Menus)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {digitalRaceDivisionAdmins.map((admin) => {
                const divisionMeta = admin.division ? SRI_LANKA_DIVISIONS[admin.division] : null;
                return (
                  <div key={admin.id} className="bg-slate-900/90 border border-cyan-800/40 hover:border-cyan-500/50 rounded-2xl p-4.5 flex flex-col justify-between transition-all shadow-md">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-800/30">
                          {divisionMeta?.name || admin.division}
                        </span>
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="p-1 hover:text-white text-slate-400 transition-colors"
                          title="Edit admin"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h5 className="text-sm font-black text-white mt-2">{admin.name}</h5>
                      
                      {/* Assigned Provinces */}
                      <div className="mt-2.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Bound Provinces ({admin.allowedProvinces.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {admin.allowedProvinces.map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                              {PROVINCE_NAMES[p]}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Credentials */}
                      <div className="mt-3.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-sans">Email:</span>
                          <span className="text-white truncate max-w-[130px]">{admin.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-sans">Mobile:</span>
                          <span className="text-white">{admin.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-sans">Password:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-cyan-300 font-bold">
                              {visiblePasswords[admin.id] ? admin.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(admin.id)}
                              className="text-slate-500 hover:text-white"
                            >
                              {visiblePasswords[admin.id] ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(admin.password, `pass-${admin.id}`)}
                              className="text-slate-500 hover:text-white"
                            >
                              {copiedId === `pass-${admin.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status / created (Asia/Colombo) / portal link / actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            admin.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              admin.status === 'PENDING_APPROVAL' ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          />
                          {admin.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'ACTIVE'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono" title={admin.createdAt}>
                          ⏱ {formatColombo(admin.createdAt)}
                        </span>
                      </div>

                      <a
                        href={`/?login=true&portal=division&division=${(admin.division || 'western').toLowerCase()}&email=${encodeURIComponent(admin.email)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open this admin's login portal (email prefilled)"
                        className="block truncate font-mono text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors"
                      >
                        /?login=true&portal=division&division={String(admin.division || 'western').toLowerCase()}&email={admin.email}
                      </a>

                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => {
                            const info = `User: ${admin.email}\nPhone: ${admin.phone}\nPassword: ${admin.password}\nRole: DIVISION_ADMIN (${admin.division})\nProvinces: ${admin.allowedProvinces.join(', ')}`;
                            copyToClipboard(info, `full-${admin.id}`);
                            showNotification(`📋 Login details for ${admin.name} copied!`);
                          }}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                        >
                          Copy Login Details
                        </button>
                        {admin.status === 'PENDING_APPROVAL' && canApproveDivision && (
                          <button
                            onClick={() => handleApproveAdmin(admin)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {canDeleteAdmins && (
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            title="Delete (Super Master only)"
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/40 hover:bg-rose-500/25 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section B: TasteTrip Division Admins */}
        {(selectedBranch === 'ALL' || selectedBranch === 'TASTETRIP') && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <Truck className="w-4 h-4" />
              TasteTrip • 4 Regional Division Admins (Fleet & Food Delivery Outlets)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tasteTripDivisionAdmins.map((admin) => {
                const divisionMeta = admin.division ? SRI_LANKA_DIVISIONS[admin.division] : null;
                return (
                  <div key={admin.id} className="bg-slate-900/90 border border-rose-800/40 hover:border-rose-500/50 rounded-2xl p-4.5 flex flex-col justify-between transition-all shadow-md">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-bold uppercase tracking-wider border border-rose-800/30">
                          {divisionMeta?.name || admin.division}
                        </span>
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="p-1 hover:text-white text-slate-400 transition-colors"
                          title="Edit admin"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h5 className="text-sm font-black text-white mt-2">{admin.name}</h5>
                      
                      {/* Assigned Provinces */}
                      <div className="mt-2.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Bound Provinces ({admin.allowedProvinces.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {admin.allowedProvinces.map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                              {PROVINCE_NAMES[p]}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Credentials */}
                      <div className="mt-3.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-sans">Email:</span>
                          <span className="text-white truncate max-w-[130px]">{admin.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-sans">Mobile:</span>
                          <span className="text-white">{admin.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-sans">Password:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-rose-300 font-bold">
                              {visiblePasswords[admin.id] ? admin.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(admin.id)}
                              className="text-slate-500 hover:text-white"
                            >
                              {visiblePasswords[admin.id] ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(admin.password, `pass-${admin.id}`)}
                              className="text-slate-500 hover:text-white"
                            >
                              {copiedId === `pass-${admin.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status / created (Asia/Colombo) / portal link / actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            admin.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              admin.status === 'PENDING_APPROVAL' ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          />
                          {admin.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'ACTIVE'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono" title={admin.createdAt}>
                          ⏱ {formatColombo(admin.createdAt)}
                        </span>
                      </div>

                      <a
                        href={`/?login=true&portal=division&division=${(admin.division || 'western').toLowerCase()}&email=${encodeURIComponent(admin.email)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open this admin's login portal (email prefilled)"
                        className="block truncate font-mono text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        /?login=true&portal=division&division={String(admin.division || 'western').toLowerCase()}&email={admin.email}
                      </a>

                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => {
                            const info = `User: ${admin.email}\nPhone: ${admin.phone}\nPassword: ${admin.password}\nRole: DIVISION_ADMIN (${admin.division})\nProvinces: ${admin.allowedProvinces.join(', ')}`;
                            copyToClipboard(info, `full-${admin.id}`);
                            showNotification(`📋 Login details for ${admin.name} copied!`);
                          }}
                          className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                        >
                          Copy Login Details
                        </button>
                        {admin.status === 'PENDING_APPROVAL' && canApproveDivision && (
                          <button
                            onClick={() => handleApproveAdmin(admin)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {canDeleteAdmins && (
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            title="Delete (Super Master only)"
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/40 hover:bg-rose-500/25 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* EDIT / CREATE ADMIN MODAL                                            */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formBranch === 'DIGITAL_RACE' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {formRole === 'DIVISION_ADMIN' ? <MapPin className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingAdmin ? `Edit ${editingAdmin.name}` : 'Provision New Enterprise Admin'}
                  </h3>
                  <p className="text-slate-400 text-xs">Separate username, password & provincial boundary configuration</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    placeholder="e.g. Western Regional Admin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Platform Vertical</label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value as PlatformBranch)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="DIGITAL_RACE">Vertical A: Digital Race (Restaurants)</option>
                    <option value="TASTETRIP">Vertical B: TasteTrip (Delivery Fleet)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Username / Official Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    placeholder="admin@ceyteq.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Phone (+94...)</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    placeholder="+94 77 000 0000"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Dedicated Password</label>
                  <button
                    type="button"
                    onClick={() => setFormPassword(`Ceyteq@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Division & Province selection for Division Admins */}
              {formRole === 'DIVISION_ADMIN' && (
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Assigned Division</label>
                    <select
                      value={formDivision}
                      onChange={(e) => handleDivisionChange(e.target.value as DivisionId)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="UP_COUNTRY">Up Country Division (Central, Uva, Sabaragamuwa)</option>
                      <option value="SOUTH">South Division (Southern, Eastern)</option>
                      <option value="WESTERN">Western Division (Western, North Western)</option>
                      <option value="NORTH">North Division (Northern, North Central)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Allowed Provinces (Geographic Partitioning):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(PROVINCE_NAMES) as SriLankanProvince[]).map((prov) => {
                        const isChecked = formProvinces.includes(prov);
                        return (
                          <label
                            key={prov}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                              isChecked
                                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleProvince(prov)}
                              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                            />
                            <span>{PROVINCE_NAMES[prov]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Granular Permission Toggles */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Granular Permissions Matrix
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canProvisionTenants}
                      onChange={(e) => setCanProvisionTenants(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-slate-300">Register new restaurants / outlets</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canResetCredentials}
                      onChange={(e) => setCanResetCredentials(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-slate-300">Reset passwords for local vendors</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canManageFleet}
                      onChange={(e) => setCanManageFleet(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-slate-300">Manage delivery drivers & dispatch</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canConfigureAddons}
                      onChange={(e) => setCanConfigureAddons(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-slate-300">Toggle WhatsApp & AI Bot modules</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save & Deploy Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* OFFICIAL LOGIN LINKS & PORTALS DIRECTORY MODAL                       */}
      {/* ==================================================================== */}
      {isLinksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Official Login Links & Portals Directory
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Main Project Managers සහ Division Admins ලාට Login වීම සඳහා වන නිල Link සහ Credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLinksModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Domain Switcher */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-300 block">Link Environment Target:</span>
                <span className="text-[11px] text-slate-500">
                  Select whether to generate links with the live production domain or preview domain.
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700/80">
                <button
                  onClick={() => setUseProductionUrl(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    useProductionUrl
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Production (Vercel)
                </button>
                <button
                  onClick={() => setUseProductionUrl(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !useProductionUrl
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Preview / Current
                </button>
              </div>
            </div>

            {/* Links List */}
            {(() => {
              const baseUrl = useProductionUrl
                ? 'https://maker-digitalracemanagementpanel.vercel.app'
                : (typeof window !== 'undefined' ? window.location.origin : 'https://maker-digitalracemanagementpanel.vercel.app');

              const superAdminUrl = `${baseUrl}/?login=true&portal=super&email=${encodeURIComponent(creds.superAdminEmail)}`;
              const drMasterUrl = `${baseUrl}/?login=true&portal=digitalrace&email=${encodeURIComponent(digitalRaceMaster?.email || 'digitalrace.master@ceyteq.com')}`;
              const ttMasterUrl = `${baseUrl}/?login=true&portal=tastetrip&email=${encodeURIComponent(tasteTripMaster?.email || 'tastetrip.master@ceyteq.com')}`;

              return (
                <div className="mt-6 space-y-6">
                  {/* LEVEL 1: SUPER MASTER ADMIN */}
                  <div className="bg-slate-950/80 border-2 border-amber-500/40 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          Level 1: Root Super Master Admin
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        Global Root Authority
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Email / Username:</span>
                        <span className="text-white font-mono font-bold">{creds.superAdminEmail}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Password:</span>
                        <span className="text-amber-300 font-mono font-bold">{creds.superAdminPassword}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <div className="truncate font-mono text-cyan-300 select-all">
                        {superAdminUrl}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            copyToClipboard(superAdminUrl, 'link-super');
                            showNotification('🔗 Super Master Login Link copied!');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          {copiedId === 'link-super' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy Link
                        </button>
                        <button
                          onClick={() => {
                            const kit = `👑 Ceyteq Super Master Admin\nURL: ${superAdminUrl}\nEmail: ${creds.superAdminEmail}\nPassword: ${creds.superAdminPassword}\nMobile: ${creds.superAdminPhone}`;
                            copyToClipboard(kit, 'kit-super');
                            showNotification('📋 Full Super Master Login Kit copied!');
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          {copiedId === 'kit-super' ? <Check className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                          Copy Credentials Kit
                        </button>
                        <a
                          href={superAdminUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                          title="Open portal"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* LEVEL 2: MAIN PROJECT MANAGERS (BRANCH MASTER ADMINS) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" />
                      Level 2: Main Project Managers (Branch Master Admins - 2 දෙනා)
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Digital Race Master */}
                      {digitalRaceMaster && (
                        <div className="bg-slate-950/80 border border-cyan-500/40 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              Digital Race Manager (Restaurants)
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">
                              Branch Master
                            </span>
                          </div>

                          <div className="text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Username:</span>
                              <span className="text-white font-bold">{digitalRaceMaster.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Password:</span>
                              <span className="text-cyan-300 font-bold">{digitalRaceMaster.password}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-2">
                            <span className="truncate font-mono text-slate-400 text-[11px]">{drMasterUrl}</span>
                            <button
                              onClick={() => {
                                copyToClipboard(drMasterUrl, 'link-dr-master');
                                showNotification('🔗 Digital Race Master Link copied!');
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                            >
                              {copiedId === 'link-dr-master' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              Copy
                            </button>
                            <a
                              href={drMasterUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <button
                            onClick={() => {
                              const kit = `🏢 Digital Race Master Admin\nURL: ${drMasterUrl}\nUsername: ${digitalRaceMaster.email}\nPassword: ${digitalRaceMaster.password}\nMobile: ${digitalRaceMaster.phone}\nRole: DIGITAL_RACE_MASTER`;
                              copyToClipboard(kit, 'kit-dr-master');
                              showNotification('📋 Digital Race Login Kit copied!');
                            }}
                            className="w-full py-1.5 bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Copy Full Login Credentials
                          </button>
                        </div>
                      )}

                      {/* TasteTrip Master */}
                      {tasteTripMaster && (
                        <div className="bg-slate-950/80 border border-rose-500/40 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5" />
                              TasteTrip Manager (Food Delivery)
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold">
                              Branch Master
                            </span>
                          </div>

                          <div className="text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Username:</span>
                              <span className="text-white font-bold">{tasteTripMaster.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Password:</span>
                              <span className="text-rose-300 font-bold">{tasteTripMaster.password}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-2">
                            <span className="truncate font-mono text-slate-400 text-[11px]">{ttMasterUrl}</span>
                            <button
                              onClick={() => {
                                copyToClipboard(ttMasterUrl, 'link-tt-master');
                                showNotification('🔗 TasteTrip Master Link copied!');
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                            >
                              {copiedId === 'link-tt-master' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              Copy
                            </button>
                            <a
                              href={ttMasterUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <button
                            onClick={() => {
                              const kit = `🛵 TasteTrip Master Admin\nURL: ${ttMasterUrl}\nUsername: ${tasteTripMaster.email}\nPassword: ${tasteTripMaster.password}\nMobile: ${tasteTripMaster.phone}\nRole: TASTETRIP_MASTER`;
                              copyToClipboard(kit, 'kit-tt-master');
                              showNotification('📋 TasteTrip Login Kit copied!');
                            }}
                            className="w-full py-1.5 bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Copy Full Login Credentials
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LEVEL 3: 4 DIVISION ADMINS - DIGITAL RACE */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      <MapPin className="w-4 h-4" />
                      Level 3: Digital Race Regional Division Admins (Restaurants & Digital Menus - 4 දෙනා)
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {digitalRaceDivisionAdmins.map((admin) => {
                        const divUrl = `${baseUrl}/?login=true&portal=division&division=${(admin.division || '').toLowerCase()}&email=${encodeURIComponent(admin.email)}`;
                        const divMeta = admin.division ? SRI_LANKA_DIVISIONS[admin.division] : null;
                        return (
                          <div key={admin.id} className="bg-slate-950 p-3.5 rounded-2xl border border-cyan-800/40 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white">{admin.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/30">
                                {divMeta?.name}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-400">
                              Provinces: {admin.allowedProvinces.map(p => PROVINCE_NAMES[p]).join(', ')}
                            </div>

                            <div className="text-[11px] bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1 font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-sans">Email:</span>
                                <span className="text-white truncate max-w-[140px]">{admin.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-sans">Password:</span>
                                <span className="text-cyan-300 font-bold">{admin.password}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  copyToClipboard(divUrl, `link-${admin.id}`);
                                  showNotification(`🔗 Link for ${admin.name} copied!`);
                                }}
                                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                              >
                                {copiedId === `link-${admin.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                Copy Link
                              </button>
                              <button
                                onClick={() => {
                                  const kit = `📍 ${admin.name} (Digital Race)\nURL: ${divUrl}\nEmail: ${admin.email}\nPassword: ${admin.password}\nPhone: ${admin.phone}\nProvinces: ${admin.allowedProvinces.join(', ')}`;
                                  copyToClipboard(kit, `kit-${admin.id}`);
                                  showNotification(`📋 Login Kit for ${admin.name} copied!`);
                                }}
                                className="flex-1 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                              >
                                <Key className="w-3 h-3" />
                                Login Kit
                              </button>
                              <a
                                href={divUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            <button
                              onClick={() => handleGenerateInviteLink(admin)}
                              className="w-full py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              Generate 24h Activation Link (HMAC)
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LEVEL 3: 4 DIVISION ADMINS - TASTETRIP */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                      <Truck className="w-4 h-4" />
                      Level 3: TasteTrip Regional Division Admins (Fleet Drivers & Food Delivery - 4 දෙනා)
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tasteTripDivisionAdmins.map((admin) => {
                        const divUrl = `${baseUrl}/?login=true&portal=division&division=${(admin.division || '').toLowerCase()}&email=${encodeURIComponent(admin.email)}`;
                        const divMeta = admin.division ? SRI_LANKA_DIVISIONS[admin.division] : null;
                        return (
                          <div key={admin.id} className="bg-slate-950 p-3.5 rounded-2xl border border-rose-800/40 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white">{admin.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-800/30">
                                {divMeta?.name}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-400">
                              Provinces: {admin.allowedProvinces.map(p => PROVINCE_NAMES[p]).join(', ')}
                            </div>

                            <div className="text-[11px] bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1 font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-sans">Email:</span>
                                <span className="text-white truncate max-w-[140px]">{admin.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-sans">Password:</span>
                                <span className="text-rose-300 font-bold">{admin.password}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  copyToClipboard(divUrl, `link-${admin.id}`);
                                  showNotification(`🔗 Link for ${admin.name} copied!`);
                                }}
                                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                              >
                                {copiedId === `link-${admin.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                Copy Link
                              </button>
                              <button
                                onClick={() => {
                                  const kit = `🛵 ${admin.name} (TasteTrip)\nURL: ${divUrl}\nEmail: ${admin.email}\nPassword: ${admin.password}\nPhone: ${admin.phone}\nProvinces: ${admin.allowedProvinces.join(', ')}`;
                                  copyToClipboard(kit, `kit-${admin.id}`);
                                  showNotification(`📋 Login Kit for ${admin.name} copied!`);
                                }}
                                className="flex-1 py-1.5 bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                              >
                                <Key className="w-3 h-3" />
                                Login Kit
                              </button>
                              <a
                                href={divUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            <button
                              onClick={() => handleGenerateInviteLink(admin)}
                              className="w-full py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-3 h-3 text-rose-400" />
                              Generate 24h Activation Link (HMAC)
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                All credentials & URLs are cryptographically protected and synchronized with PostgreSQL RBAC schemas.
              </span>
              <button
                onClick={() => setIsLinksModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 24-HOUR CRYPTOGRAPHIC INVITATION MODAL                               */}
      {/* ==================================================================== */}
      {activeInvitation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  HMAC-SHA256 • 24-Hour Expiry
                </span>
                <h4 className="text-base font-black text-white">Single-Use Activation Link Generated</h4>
                <p className="text-xs text-slate-400">Recipient: <strong className="text-white">{activeInvitation.name}</strong> ({activeInvitation.email})</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="text-[11px] text-slate-400 font-sans">
                This activation link is cryptographically signed, valid for exactly 24 hours, and automatically self-destructs upon initial password configuration:
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 break-all text-amber-300 select-all font-mono text-[11px]">
                {activeInvitation.activationUrl}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                <span>Expires in: <strong className="text-amber-400">23 hours, 59 mins</strong></span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Auto-copied to clipboard
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    copyToClipboard(activeInvitation.activationUrl, 'inv-modal-url');
                    showNotification('🔗 Activation Link copied!');
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {copiedId === 'inv-modal-url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy Activation Link
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`👋 Hello ${activeInvitation.name}! Here is your single-use Ceyteq Admin account activation link: ${activeInvitation.activationUrl}\n(Valid for 24 hours. Please click to set your permanent password and activate your assigned division access.)`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeInvitation.activationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Test Activation Screen Directly
                </a>
                <button
                  onClick={() => setActiveInvitation(null)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
