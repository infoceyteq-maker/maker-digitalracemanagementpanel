import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Plus, 
  Search, 
  ShieldCheck, 
  Globe, 
  ExternalLink, 
  Power, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  QrCode, 
  Eye, 
  MoreVertical,
  Layers,
  ArrowUpRight,
  Server,
  Bike,
  Smartphone,
  Sliders,
  Settings,
  CreditCard,
  MessageSquare,
  Utensils,
  Sparkles,
  RefreshCw,
  FileText,
  Clock,
  Check,
  X,
  Filter,
  Receipt,
  Bot,
  Zap,
  Key,
  Trash2,
  Copy
} from 'lucide-react';
import { Tenant, TenantPlan, TenantStatus, SubscriptionTier, DeliveryDriver } from '../types';
import { CeyteqLogo } from './CeyteqLogo';
import { CeyteqAiChatbot } from './CeyteqAiChatbot';
import { credentialsService } from '../lib/credentialsService';

interface SuperAdminPanelProps {
  tenants: Tenant[];
  onSelectTenant: (tenantId: string) => void;
  onUpdateTenantStatus: (tenantId: string, status: TenantStatus) => void;
  onCreateTenant: (newTenant: Partial<Tenant>) => void;
  onSwitchToTenantDashboard: (tenantId: string) => void;
  onNavigateToTasteTrip?: () => void;
  onUpdateTenant?: (updatedTenant: Tenant) => void;
  drivers?: DeliveryDriver[];
  onClearDemoOrders?: () => void;
  onResetAllDemoData?: (cleanStarterRestaurant?: boolean) => void;
  onOpenAuthModal?: () => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  tenants,
  onSelectTenant,
  onUpdateTenantStatus,
  onCreateTenant,
  onSwitchToTenantDashboard,
  onNavigateToTasteTrip,
  onUpdateTenant,
  drivers = [],
  onClearDemoOrders,
  onResetAllDemoData,
  onOpenAuthModal,
}) => {
  // Navigation tabs within Master Dashboard (Module 1)
  const [activeTab, setActiveTab] = useState<'CLIENTS' | 'SALES' | 'FLEET' | 'SETTINGS' | 'AI_COPILOT'>('CLIENTS');

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'TRIAL'>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'FREE' | 'PLUS' | 'PRO'>('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [dnsCheckMessage, setDnsCheckMessage] = useState<string | null>(null);
  const [isFloatingBotOpen, setIsFloatingBotOpen] = useState(false);

  // New Client Form State
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('spice@owner2026');
  const [newKitchenPin, setNewKitchenPin] = useState('2026');
  const [newWaiterPin, setNewWaiterPin] = useState('1122');
  const [newPhone, setNewPhone] = useState('+94 77 123 4567');
  const [newAddress, setNewAddress] = useState('Colombo, Sri Lanka');
  const [newCurrency, setNewCurrency] = useState<'LKR' | 'USD' | 'EUR' | 'AED'>('LKR');
  const [newTableCount, setNewTableCount] = useState<number>(15);
  const [newTier, setNewTier] = useState<SubscriptionTier>('PRO');
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [newHasAiChatbot, setNewHasAiChatbot] = useState<boolean>(true);
  const [newStarterMenu, setNewStarterMenu] = useState<'STARTER' | 'BLANK'>('STARTER');
  const [createdNotice, setCreatedNotice] = useState<{
    name: string;
    slug: string;
    email: string;
    password: string;
    kitchenPin: string;
    waiterPin: string;
  } | null>(null);

  // Auto-slug generator
  const handleNameChange = (val: string) => {
    setNewName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setNewSlug(generatedSlug);
    setNewOwnerPassword(`${generatedSlug || 'owner'}@2026`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug || !newOwnerEmail) return;

    const monthlyFee = newTier === 'FREE' ? 0 : newTier === 'PLUS' ? 49 : 129;
    const plan: TenantPlan = newTier === 'FREE' ? 'STARTER' : newTier === 'PLUS' ? 'PRO' : 'ENTERPRISE';

    const newTenantData: Partial<Tenant> = {
      name: newName,
      slug: newSlug,
      ownerName: newOwnerName,
      ownerEmail: newOwnerEmail,
      ownerPassword: newOwnerPassword,
      kitchenPin: newKitchenPin,
      waiterPin: newWaiterPin,
      phone: newPhone,
      address: newAddress,
      currency: newCurrency,
      tableCount: Number(newTableCount) || 12,
      tier: newTier,
      plan,
      monthlyFee: monthlyFee + (newHasAiChatbot && newTier === 'PLUS' ? 29 : 0),
      customDomain: newCustomDomain ? newCustomDomain.trim() : undefined,
      customDomainVerified: false,
      dnsStatus: newCustomDomain ? 'PENDING' : 'NOT_CONFIGURED',
      deliveryEnabled: newTier !== 'FREE',
      paymentGatewayEnabled: newTier !== 'FREE',
      whatsappMessagingEnabled: newTier !== 'FREE',
      hasAiChatbot: newHasAiChatbot,
      aiChatbotConfig: {
        enabled: newHasAiChatbot,
        whatsappPhoneNumberId: '',
        whatsappVerifyToken: 'ceyteq_wa_verify_token',
        autoReplyEnabled: true,
        botTone: 'POLITE_CONCIERGE',
        welcomeMessage: `Welcome to ${newName}! How can I help you today?`,
        conversationsCount: 0,
      },
    };

    if (newStarterMenu === 'BLANK') {
      newTenantData.categories = [
        { id: `cat-1-${Date.now()}`, name: 'Main Dishes', nameSi: 'ප්‍රධාන ආහාර', iconName: 'Utensils', order: 1 }
      ];
      newTenantData.products = [];
    }

    onCreateTenant(newTenantData);

    setCreatedNotice({
      name: newName,
      slug: newSlug,
      email: newOwnerEmail,
      password: newOwnerPassword,
      kitchenPin: newKitchenPin,
      waiterPin: newWaiterPin,
    });

    setIsCreateModalOpen(false);
    setNewName('');
    setNewSlug('');
    setNewOwnerName('');
    setNewOwnerEmail('');
    setNewCustomDomain('');
    setNewTier('PRO');
    setNewHasAiChatbot(true);
  };

  // Instant Tier Switcher Handler
  const handleTierChange = (tenant: Tenant, newTier: SubscriptionTier) => {
    if (!onUpdateTenant) return;
    const updatedFee = newTier === 'FREE' ? 0 : newTier === 'PLUS' ? 49 : 129;
    const updatedPlan: TenantPlan = newTier === 'FREE' ? 'STARTER' : newTier === 'PLUS' ? 'PRO' : 'ENTERPRISE';
    
    onUpdateTenant({
      ...tenant,
      tier: newTier,
      plan: updatedPlan,
      monthlyFee: updatedFee,
      deliveryEnabled: newTier !== 'FREE',
      paymentGatewayEnabled: newTier !== 'FREE',
      whatsappMessagingEnabled: newTier !== 'FREE',
    });
  };

  // Save Tenant Settings from Modal
  const handleSaveTenantSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant || !onUpdateTenant) return;
    onUpdateTenant(editingTenant);
    setEditingTenant(null);
  };

  // Verify DNS simulation
  const handleVerifyDns = (tenant: Tenant) => {
    setDnsCheckMessage(`Querying Cloudflare Edge CNAME for ${tenant.customDomain}...`);
    setTimeout(() => {
      if (onUpdateTenant) {
        onUpdateTenant({
          ...tenant,
          customDomainVerified: true,
          dnsStatus: 'VERIFIED'
        });
      }
      setDnsCheckMessage(`✓ DNS Verified! ${tenant.customDomain} is mapped to cname.ceyteq.com with auto-SSL.`);
      setTimeout(() => setDnsCheckMessage(null), 4000);
    }, 1000);
  };

  // Metrics Calculations
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length;
  const totalMrr = tenants.reduce((acc, t) => acc + (t.status === 'ACTIVE' ? t.monthlyFee : 0), 0);
  const totalViews = tenants.reduce((acc, t) => acc + t.totalViews, 0);
  const totalGmv = tenants.reduce((acc, t) => acc + (t.totalOrders * 2800), 0); // approx average spend

  const proCount = tenants.filter(t => t.tier === 'PRO').length;
  const plusCount = tenants.filter(t => t.tier === 'PLUS').length;
  const freeCount = tenants.filter(t => t.tier === 'FREE').length;

  // Filtered Clients
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customDomain && t.customDomain.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesTier = tierFilter === 'ALL' || t.tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  // Recent Invoices Mock Ledger
  const recentInvoices = [
    { id: 'INV-2026-0901', client: 'Ceylon Spice Bistro', tier: 'PRO', amount: 129, date: 'Sep 01, 2026', status: 'PAID' },
    { id: 'INV-2026-0902', client: 'The Ocean Catch Club', tier: 'PRO', amount: 129, date: 'Sep 01, 2026', status: 'PAID' },
    { id: 'INV-2026-0903', client: 'Kandy Royal Lounge', tier: 'PLUS', amount: 49, date: 'Sep 02, 2026', status: 'PAID' },
    { id: 'INV-2026-0904', client: 'Southern Serenade Cafe', tier: 'PLUS', amount: 49, date: 'Sep 03, 2026', status: 'PAID' },
    { id: 'INV-2026-0905', client: 'Mirissa Blue Horizon', tier: 'FREE', amount: 0, date: 'Sep 04, 2026', status: 'FREE TIER' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-800 pb-16 font-sans">
      {/* CEYTEQ AGENCY MASTER HEADER */}
      <header className="bg-white/85 backdrop-blur-md border-b border-sky-100/90 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-4">
            <CeyteqLogo size="md" variant="light" />
            <div className="hidden sm:block h-7 w-[1px] bg-sky-200" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#00A3D9] tracking-wider uppercase">
                Digital Race
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 uppercase">
                Master Admin
              </span>
            </div>
          </div>

          {/* System Edge Status & Jasmine Profile */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Edge DNS status pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200/80 text-[11px] text-slate-700 font-mono shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00A3D9] animate-pulse" />
              <span>Edge DNS: <strong className="text-slate-900">100% Online</strong></span>
            </div>

            {/* Jasmine Agency Admin Indicator */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-sky-200/80 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-[#00C8FF] text-[#0A192F] font-black text-xs flex items-center justify-center shadow-xs">
                JP
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">Jasmine Perera</div>
                <div className="text-[10px] text-slate-500">Agency Executive</div>
              </div>
            </div>

            {/* Passwords & Staff PINs Manager Button */}
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200 transition-all shrink-0"
                title="Configure Passwords and Staff PINs"
              >
                <Key className="w-3.5 h-3.5 text-[#008BB8]" />
                <span className="hidden sm:inline">Passwords & PINs</span>
              </button>
            )}

            {/* Clear Demo Orders Action */}
            {onClearDemoOrders && (
              <button
                onClick={() => {
                  if (confirm('Clear all demo mock orders and start fresh with 0 orders?')) {
                    onClearDemoOrders();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-all shrink-0"
                title="Wipe mock orders for a clean production start"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Clear Demo Orders</span>
              </button>
            )}

            {/* Provision Restaurant Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00C8FF] hover:bg-[#00B2E3] text-[#0A192F] text-xs font-bold shadow-sm transition-transform active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Real Restaurant</span>
            </button>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-2 pt-2 overflow-x-auto no-scrollbar border-t border-sky-100">
          <button
            onClick={() => setActiveTab('CLIENTS')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'CLIENTS'
                ? 'border-[#00C8FF] text-[#0098CC]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Restaurant Clients & Tiers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 font-mono">
              {totalTenants}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SALES')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'SALES'
                ? 'border-[#00C8FF] text-[#0098CC]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Overall Sales & Financials</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
              ${totalMrr}/mo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('FLEET')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'FLEET'
                ? 'border-[#00C8FF] text-[#0098CC]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bike className="w-4 h-4 text-pink-600" />
            <span>Taste Trip Driver Network</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-50 text-pink-700 font-mono border border-pink-200">
              PRO FLEET
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'SETTINGS'
                ? 'border-[#00C8FF] text-[#0098CC]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-[#0098CC]" />
            <span>Edge Infrastructure & DNS</span>
          </button>

          <button
            onClick={() => setActiveTab('AI_COPILOT')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'AI_COPILOT'
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>Jasmine AI Copilot</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
              FREE NLP
            </span>
          </button>
        </div>
      </header>

      {/* NEW RESTAURANT PROVISIONED CREDENTIALS BANNER */}
      {createdNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-[#008BB8] text-white rounded-2xl p-5 shadow-lg border border-emerald-400/40 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md text-emerald-200">
                    Live Restaurant Ready
                  </span>
                  <h3 className="text-lg font-black">{createdNotice.name} Successfully Added!</h3>
                </div>
                <p className="text-xs text-emerald-100 max-w-2xl">
                  Your new restaurant has been deployed with real-time sync. Use the dedicated credentials below to sign in or operate the kitchen & customer portals.
                </p>
              </div>

              <button
                onClick={() => setCreatedNotice(null)}
                className="self-end md:self-auto text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl font-bold transition-all"
              >
                Dismiss Notice
              </button>
            </div>

            {/* Credentials Card Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20 text-xs">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
                <span className="text-[10px] text-emerald-200 uppercase font-bold block mb-1">Restaurant Slug</span>
                <span className="font-mono font-bold text-white text-xs block">{createdNotice.slug}</span>
                <span className="text-[10px] text-white/70">https://{createdNotice.slug}.ceyteq.com</span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
                <span className="text-[10px] text-emerald-200 uppercase font-bold block mb-1">Owner Admin Login</span>
                <span className="font-mono font-bold text-white text-xs block">{createdNotice.email}</span>
                <span className="font-mono text-[11px] text-amber-200 font-black">Pass: {createdNotice.password}</span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
                <span className="text-[10px] text-emerald-200 uppercase font-bold block mb-1">Kitchen Display PIN</span>
                <span className="font-mono font-black text-amber-300 text-base tracking-widest block">{createdNotice.kitchenPin}</span>
                <span className="text-[10px] text-white/70">For Chef KOT Terminal</span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
                <span className="text-[10px] text-emerald-200 uppercase font-bold block mb-1">Waiter Staff PIN</span>
                <span className="font-mono font-black text-sky-200 text-base tracking-widest block">{createdNotice.waiterPin}</span>
                <span className="text-[10px] text-white/70">For Mobile Handheld</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/15">
              <button
                onClick={() => {
                  const target = tenants.find(t => t.slug === createdNotice.slug);
                  if (target) onSwitchToTenantDashboard(target.id);
                }}
                className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-black hover:bg-slate-100 transition-all shadow-sm"
              >
                Go to {createdNotice.name} Dashboard →
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Restaurant: ${createdNotice.name}\nSlug: ${createdNotice.slug}\nOwner: ${createdNotice.email}\nPassword: ${createdNotice.password}\nKitchen PIN: ${createdNotice.kitchenPin}\nWaiter PIN: ${createdNotice.waiterPin}`
                  );
                  alert('Credentials copied to clipboard!');
                }}
                className="px-3.5 py-2 rounded-xl bg-black/25 hover:bg-black/40 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI METRIC CARDS ROW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Agency MRR */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm shadow-sky-950/5 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">Agency SaaS MRR</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">${totalMrr.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Recurring monthly revenue</span>
            </div>
          </div>

          {/* Card 2: Total Clients Breakdown */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm shadow-sky-950/5">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">Client Restaurants</span>
              <Building2 className="w-4 h-4 text-[#0098CC]" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalTenants} Tenants</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 font-mono">
              <span className="text-pink-600 font-bold">{proCount} Pro</span> • 
              <span className="text-sky-600 font-bold">{plusCount} Plus</span> • 
              <span className="text-slate-600">{freeCount} Free</span>
            </div>
          </div>

          {/* Card 3: Total Platform Views */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm shadow-sky-950/5">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">Total Menu Scans</span>
              <Eye className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">{totalViews.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Live digital customer visits</div>
          </div>

          {/* Card 4: Platform GMV */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm shadow-sky-950/5">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">Total Food GMV</span>
              <Sparkles className="w-4 h-4 text-[#0098CC]" />
            </div>
            <div className="text-2xl font-black text-[#0098CC] font-mono">
              Rs. {(totalGmv / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Order value processed</div>
          </div>
        </div>
      </div>

      {/* TAB 1: RESTAURANT CLIENTS & SUBSCRIPTION TIERS */}
      {activeTab === 'CLIENTS' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          {/* Controls Bar */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by restaurant name, domain, slug, or owner..."
                className="w-full bg-white border border-sky-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00C8FF] shadow-2xs"
              />
            </div>

            {/* Tier Filters & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tier Filter */}
              <div className="flex items-center bg-sky-100/70 p-1 rounded-xl border border-sky-200/60 shadow-inner">
                {(['ALL', 'PRO', 'PLUS', 'FREE'] as const).map((tr) => (
                  <button
                    key={tr}
                    onClick={() => setTierFilter(tr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      tierFilter === tr
                        ? 'bg-[#00C8FF] text-[#0A192F] shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tr === 'ALL' ? 'All Tiers' : tr}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-sky-100/70 p-1 rounded-xl border border-sky-200/60 shadow-inner">
                {(['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 shadow-sm font-bold border border-sky-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DNS Verification Alert Notification */}
          {dnsCheckMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{dnsCheckMessage}</span>
              </div>
              <button onClick={() => setDnsCheckMessage(null)} className="text-emerald-700 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Clients Table */}
          <div className="bg-white/95 border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/80 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-sky-100">
                  <tr>
                    <th className="py-3 px-4">Restaurant / Client</th>
                    <th className="py-3 px-4">Subdomain & Custom Domain</th>
                    <th className="py-3 px-4">Subscription Tier & Fee</th>
                    <th className="py-3 px-4">Enabled Capabilities</th>
                    <th className="py-3 px-4">Access Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70 font-medium">
                  {filteredTenants.map((t) => {
                    const isActive = t.status === 'ACTIVE';
                    const isPro = t.tier === 'PRO';
                    const isPlus = t.tier === 'PLUS';
                    const isFree = t.tier === 'FREE';

                    return (
                      <tr key={t.id} className="hover:bg-sky-50/50 transition-colors">
                        {/* Client Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={t.logoUrl} 
                              alt={t.name}
                              className="w-10 h-10 rounded-xl object-cover border border-sky-200 bg-white shrink-0 shadow-xs"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{t.name}</span>
                                {isPro && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-pink-50 text-pink-700 border border-pink-200">
                                    PRO APP
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px]">{t.ownerName} • {t.ownerEmail}</div>
                            </div>
                          </div>
                        </td>

                        {/* Domain Routing */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="text-slate-700">
                              {t.subdomain}.ceyteq.com
                            </div>
                            {t.customDomain ? (
                              <div className="flex items-center gap-1.5 text-[#008BB8] font-bold">
                                <Globe className="w-3 h-3 text-[#00A3D9]" />
                                <span>{t.customDomain}</span>
                                {t.customDomainVerified ? (
                                  <span className="text-[9px] px-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    SSL Active
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleVerifyDns(t)}
                                    className="text-[9px] px-1 rounded bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors cursor-pointer"
                                    title="Click to trigger Edge CNAME verification"
                                  >
                                    Verify DNS
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No custom domain</span>
                            )}
                          </div>
                        </td>

                        {/* Tier Selector & Fee */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={t.tier || 'PRO'}
                              onChange={(e) => handleTierChange(t, e.target.value as SubscriptionTier)}
                              className={`text-xs font-bold rounded-lg px-2 py-1 border cursor-pointer focus:outline-none shadow-2xs ${
                                isPro
                                  ? 'bg-pink-50 text-pink-700 border-pink-300'
                                  : isPlus
                                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                                  : 'bg-slate-50 text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="FREE">Free Tier ($0/mo)</option>
                              <option value="PLUS">Plus Tier ($49/mo)</option>
                              <option value="PRO">Pro Tier ($129/mo)</option>
                            </select>

                            <div className="text-[11px] font-mono text-slate-500">
                              Billing: <strong className="text-slate-900 font-bold">${t.monthlyFee}/mo</strong>
                            </div>
                          </div>
                        </td>

                        {/* Capabilities Pills */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              QR Menu
                            </span>
                            {t.deliveryEnabled && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                                Delivery
                              </span>
                            )}
                            {t.paymentGatewayEnabled && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                Cards
                              </span>
                            )}
                            {isPro && (
                              <span className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200 font-bold">
                                Taste Trip
                              </span>
                            )}
                            {t.hasAiChatbot && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-0.5" title="AI WhatsApp Chatbot Messaging System Enabled">
                                <Bot className="w-2.5 h-2.5" />
                                <span>WhatsApp AI</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => onUpdateTenantStatus(t.id, isActive ? 'SUSPENDED' : 'ACTIVE')}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                              isActive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100'
                            }`}
                            title="Click to toggle access on/off"
                          >
                            <Power className="w-3 h-3" />
                            <span>{isActive ? 'Active' : 'Suspended'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Configure Tenant Modal Button */}
                            <button
                              onClick={() => setEditingTenant({ ...t })}
                              className="p-1.5 rounded-lg bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 text-xs font-semibold shadow-2xs"
                              title="Configure Tenant Settings, Domains, and Roles"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>

                            {/* Open Restaurant Admin Dashboard */}
                            <button
                              onClick={() => onSwitchToTenantDashboard(t.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-[#00C8FF] text-[#008BB8] hover:text-[#0A192F] text-xs font-bold border border-sky-200 transition-all shadow-xs group"
                              title="Impersonate & Open Client Web Panel"
                            >
                              <span>Enter Panel</span>
                              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Client Cards (Visible exclusively on mobile screens < 768px) */}
            <div className="md:hidden divide-y divide-sky-100">
              {filteredTenants.map((t) => {
                const isActive = t.status === 'ACTIVE';
                const isPro = t.tier === 'PRO';
                const isPlus = t.tier === 'PLUS';

                return (
                  <div key={t.id} className="p-4 space-y-3 bg-white">
                    {/* Header: Logo, Name, Tier & Status Switch */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={t.logoUrl} 
                          alt={t.name}
                          className="w-11 h-11 rounded-xl object-cover border border-sky-200 bg-white shrink-0 shadow-xs"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                            <span>{t.name}</span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                              isPro ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                              isPlus ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {t.tier}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px]">{t.ownerName} • {t.ownerEmail}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => onUpdateTenantStatus(t.id, isActive ? 'SUSPENDED' : 'ACTIVE')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-pink-50 text-pink-700 border border-pink-200'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{isActive ? 'Active' : 'Suspended'}</span>
                      </button>
                    </div>

                    {/* Subdomain & Tier Pricing Box */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-sky-100/80 font-mono">
                      <span className="text-slate-700 truncate max-w-[180px]">{t.subdomain}.ceyteq.com</span>
                      <span className="font-bold text-slate-900 font-sans">
                        {isPro ? '$129/mo' : isPlus ? '$49/mo' : 'Free'}
                      </span>
                    </div>

                    {/* Mobile Touch Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setEditingTenant({ ...t })}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 shrink-0"
                        title="Configure Settings"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={() => onSwitchToTenantDashboard(t.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-50 hover:bg-[#00C8FF] text-[#008BB8] hover:text-[#0A192F] text-xs font-bold border border-sky-200 transition-all shadow-xs"
                      >
                        <span>Enter Dashboard</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OVERALL SALES & FINANCIAL MONITORING */}
      {activeTab === 'SALES' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          {/* Revenue Breakdown by Tier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-pink-600 font-bold mb-1">
                <span>Pro Tier Revenue</span>
                <span className="text-[10px] bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded text-pink-700">68% Share</span>
              </div>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                ${(proCount * 129).toLocaleString()}/mo
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {proCount} restaurants subscribing to Total Operations, POS, KOT & Taste Trip Mobile.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#008BB8] font-bold mb-1">
                <span>Plus Tier Revenue</span>
                <span className="text-[10px] bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded text-sky-700">28% Share</span>
              </div>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                ${(plusCount * 49).toLocaleString()}/mo
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {plusCount} restaurants utilizing custom web panel, delivery ordering & WhatsApp status.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                <span>Free Tier (Funnel)</span>
                <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">4% Share</span>
              </div>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                $0/mo
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {freeCount} restaurants on basic QR digital menu. Prime pipeline for upselling to Plus & Pro.
              </p>
            </div>
          </div>

          {/* Invoices Ledger Table */}
          <div className="bg-white/95 border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#00A3D9]" />
                  <span>Ceyteq Agency SaaS Billing Invoices</span>
                </h3>
                <p className="text-xs text-slate-500">Automated recurring subscription payments collected via Stripe Connect.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/80 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-sky-100">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Restaurant Client</th>
                    <th className="py-3 px-4">Subscription Plan</th>
                    <th className="py-3 px-4">Billed Amount</th>
                    <th className="py-3 px-4">Billing Date</th>
                    <th className="py-3 px-4">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70 font-medium">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.id}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">{inv.client}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                          {inv.tier} TIER
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">${inv.amount}.00</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{inv.date}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TASTE TRIP DRIVER FLEET MANAGEMENT */}
      {activeTab === 'FLEET' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          {/* Fleet Highlight Banner */}
          <div className="bg-gradient-to-r from-white via-pink-50/40 to-sky-50/50 border border-sky-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-pink-600 uppercase tracking-wider">
                <Bike className="w-4 h-4" />
                <span>Taste Trip Pro Courier Network</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Centralized Colombo Rider Fleet & GPS Dispatch
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Taste Trip is the dedicated courier network serving Pro tier restaurant orders. Manage on-duty couriers, verify rider KYC documents, and monitor live delivery dispatch.
              </p>
            </div>

            {onNavigateToTasteTrip && (
              <button
                onClick={onNavigateToTasteTrip}
                className="px-5 py-2.5 rounded-xl bg-[#00C8FF] hover:bg-[#00B2E3] text-[#0A192F] text-xs font-bold shadow-sm flex items-center gap-2 shrink-0 transition-transform active:scale-95"
              >
                <span>Launch Live Driver Radar & Cockpit</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Fleet Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-500">Total Registered Couriers</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">{drivers.length || 6} Riders</p>
              <span className="text-xs text-emerald-600 mt-2 block font-medium">100% KYC Verified & Documented</span>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-500">Avg Colombo Delivery Time</span>
              <p className="text-2xl font-black text-[#008BB8] font-mono mt-1">23.8 Mins</p>
              <span className="text-xs text-slate-500 mt-2 block">High-accuracy GPS telemetry</span>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-500">Dispatch Acceptance Rate</span>
              <p className="text-2xl font-black text-pink-600 font-mono mt-1">98.6%</p>
              <span className="text-xs text-slate-500 mt-2 block">Radar auto-fallback enabled</span>
            </div>
          </div>

          {/* Drivers Roster */}
          <div className="bg-white/95 border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00A3D9]" />
                <span>Central Rider Directory</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/80 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-sky-100">
                  <tr>
                    <th className="py-3 px-4">Courier Name</th>
                    <th className="py-3 px-4">Vehicle & License Plate</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">KYC Status</th>
                    <th className="py-3 px-4">Rating & Trips</th>
                    <th className="py-3 px-4">Duty Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70 font-medium">
                  {(drivers.length > 0 ? drivers : [
                    { id: 'dr-1', name: 'Naveen Perera', phone: '+94 77 123 4567', vehicleType: 'MOTORBIKE', vehiclePlate: 'WP BDF-4892', rating: 4.9, totalTrips: 342, isAvailable: true, kycVerified: true },
                    { id: 'dr-2', name: 'Chaminda Silva', phone: '+94 71 987 6543', vehicleType: 'SCOOTER', vehiclePlate: 'WP CAL-8921', rating: 4.8, totalTrips: 218, isAvailable: true, kycVerified: true },
                    { id: 'dr-3', name: 'Ashen Bandara', phone: '+94 76 555 1212', vehicleType: 'MOTORBIKE', vehiclePlate: 'CP BIJ-1102', rating: 4.95, totalTrips: 512, isAvailable: false, kycVerified: true },
                  ]).map((dr: any) => (
                    <tr key={dr.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-xs font-black text-[#008BB8]">
                          {dr.name.charAt(0)}
                        </div>
                        <div>
                          <div>{dr.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{dr.id}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-900 font-bold">{dr.vehiclePlate}</div>
                        <div className="text-[10px] text-slate-500">{dr.vehicleType}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{dr.phone}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                          KYC VERIFIED
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-amber-500 font-bold">★ {dr.rating}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{dr.totalTrips} deliveries</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          dr.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {dr.isAvailable ? 'AVAILABLE / ON DUTY' : 'OFFLINE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EDGE INFRASTRUCTURE & SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#00A3D9]" />
              <span>Multi-Tenant Edge Architecture Configuration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Next.js Edge Middleware Status</span>
                <p className="text-xs text-slate-600">
                  Rewrites incoming Host headers to respective restaurant tenant contexts dynamically without rebuilding containers.
                </p>
                <div className="flex items-center gap-2 pt-2 text-xs font-mono text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Status: Active & Routing (Lat: 18ms)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Cloudflare Wildcard SSL (`*.ceyteq.com`)</span>
                <p className="text-xs text-slate-600">
                  Automated SSL termination with zero downtime certificate rotation for all generated restaurant subdomains.
                </p>
                <div className="flex items-center gap-2 pt-2 text-xs font-mono text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Status: Valid TLS 1.3 Active</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Custom Domain CNAME Record Target</span>
              <p className="text-xs text-slate-600">
                Give this exact record to clients using their own custom domain (e.g. `menu.oceanclub.lk`):
              </p>
              <div className="p-3 rounded-lg bg-white border border-sky-200 font-mono text-xs text-[#008BB8] flex items-center justify-between shadow-2xs">
                <span className="font-bold">CNAME: cname.ceyteq.com</span>
                <span className="text-[10px] text-slate-500">TTL: Automatic</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: JASMINE AI COPILOT */}
      {activeTab === 'AI_COPILOT' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              <span>Ceyteq Management AI Copilot (Jasmine)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Agency-level conversational assistant powered by Google Gemini NLP for tenant management, client tier analysis, and WhatsApp bot configuration.
            </p>
          </div>
          <CeyteqAiChatbot tenants={tenants} />
        </div>
      )}

      {/* MODAL 1: PROVISION NEW RESTAURANT CLIENT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-xl p-6 shadow-2xl text-slate-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-sky-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Provision Real Restaurant Tenant (අලුත් අවන්හලක්)</h2>
                <p className="text-xs text-slate-500">Deploy a real restaurant with dedicated Owner credentials and Staff PINs.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Section 1: Basic Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Galle Fort Heritage Cafe"
                    value={newName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C8FF] shadow-2xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subdomain Slug *</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="galle-fort"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      className="flex-1 bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#00C8FF] shadow-2xs"
                    />
                    <span className="text-[11px] font-mono text-slate-500">.ceyteq.com</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Owner Credentials */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#008BB8]" />
                    <span>Owner Login Credentials (මුරපද)</span>
                  </span>
                  <span className="text-[10px] bg-[#008BB8] text-white px-2 py-0.5 rounded font-bold">
                    Admin Access
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Owner Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Roshan Jayasuriya"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00C8FF]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Owner Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="owner@gallefort.lk"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#00C8FF]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Admin Password *</label>
                    <input
                      type="text"
                      required
                      value={newOwnerPassword}
                      onChange={(e) => setNewOwnerPassword(e.target.value)}
                      className="w-full bg-white border border-sky-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00C8FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Staff Terminal PINs */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Staff Terminal PINs (Kitchen & Waiter)</span>
                  </span>
                  <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded font-bold">
                    Quick Access
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-amber-900 block mb-1">Kitchen Display (KOT) PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={newKitchenPin}
                      onChange={(e) => setNewKitchenPin(e.target.value)}
                      placeholder="2026"
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-center tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-amber-900 block mb-1">Waitstaff Mobile PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={newWaiterPin}
                      onChange={(e) => setNewWaiterPin(e.target.value)}
                      placeholder="1122"
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-center tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Operational Settings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full bg-white border border-sky-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Table Count</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newTableCount}
                    onChange={(e) => setNewTableCount(Number(e.target.value))}
                    className="w-full bg-white border border-sky-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono text-center font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value as any)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                  >
                    <option value="LKR">LKR (Rs)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>

              {/* Section 5: Menu Initialization */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Initial Dish Catalog</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStarterMenu('STARTER')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newStarterMenu === 'STARTER'
                        ? 'bg-sky-50 text-sky-900 border-[#00C8FF] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">Sri Lankan Starter Menu</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Sample Rice & Curry, Kottu, Drinks</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStarterMenu('BLANK')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newStarterMenu === 'BLANK'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">Clean Blank Catalog (0 Dishes)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Start fresh and add your own real dishes</div>
                  </button>
                </div>
              </div>

              {/* Initial Subscription Tier Selection */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Initial Subscription Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTier('FREE')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newTier === 'FREE'
                        ? 'bg-sky-50 text-slate-900 border-[#00C8FF] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">Free Tier</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">$0/month</div>
                    <div className="text-[9px] text-slate-400 mt-1">QR Menu only</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTier('PLUS')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newTier === 'PLUS'
                        ? 'bg-sky-50 text-sky-800 border-[#00C8FF] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">Plus Tier</div>
                    <div className="text-[10px] text-[#008BB8] font-bold mt-0.5">$49/month</div>
                    <div className="text-[9px] text-slate-500 mt-1">Delivery + Cards</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTier('PRO')}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      newTier === 'PRO'
                        ? 'bg-pink-50 text-pink-800 border-pink-400 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="absolute top-1.5 right-1.5 text-[8px] bg-pink-600 text-white font-black px-1 rounded">POPULAR</span>
                    <div className="text-xs font-bold text-slate-900">Pro Tier</div>
                    <div className="text-[10px] text-pink-600 font-bold mt-0.5">$129/month</div>
                    <div className="text-[9px] text-slate-500 mt-1">POS, KOT & App</div>
                  </button>
                </div>
              </div>

              {/* AI Chatbot Messaging System Package Add-on Toggle */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200">
                <label className="flex items-start justify-between cursor-pointer gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">AI Chatbot Messaging System</span>
                        <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded">
                          {newTier === 'PRO' ? 'INCLUDED IN PRO' : 'PRO / PLUS ADD-ON (+$29/mo)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        Equips the restaurant with a WhatsApp-integrated AI concierge powered by Gemini NLP for 24/7 guest inquiries, reservations & automated menu orders.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newHasAiChatbot}
                    onChange={(e) => setNewHasAiChatbot(e.target.checked)}
                    className="rounded accent-emerald-600 w-4 h-4 mt-1.5 cursor-pointer shrink-0"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Custom Domain (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. menu.gallefortcafe.com"
                  value={newCustomDomain}
                  onChange={(e) => setNewCustomDomain(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#00C8FF] shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00C8FF] hover:bg-[#00B2E3] text-[#0A192F] text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  Provision & Deploy Restaurant →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TENANT SETTINGS */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#00A3D9]" />
                  <span>Configure Settings: {editingTenant.name}</span>
                </h2>
                <p className="text-xs text-slate-500">Manage tenant tier, billing fee, domain and feature entitlements.</p>
              </div>
              <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTenantSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.name}
                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C8FF] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Monthly Billing ($)</label>
                  <input
                    type="number"
                    required
                    value={editingTenant.monthlyFee}
                    onChange={(e) => setEditingTenant({ ...editingTenant, monthlyFee: Number(e.target.value) })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#00C8FF] shadow-2xs"
                  />
                </div>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Subscription Tier</label>
                <select
                  value={editingTenant.tier || 'PRO'}
                  onChange={(e) => {
                    const nextTier = e.target.value as SubscriptionTier;
                    setEditingTenant({
                      ...editingTenant,
                      tier: nextTier,
                      plan: nextTier === 'FREE' ? 'STARTER' : nextTier === 'PLUS' ? 'PRO' : 'ENTERPRISE',
                      monthlyFee: nextTier === 'FREE' ? 0 : nextTier === 'PLUS' ? 49 : 129,
                      deliveryEnabled: nextTier !== 'FREE',
                      paymentGatewayEnabled: nextTier !== 'FREE',
                    });
                  }}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C8FF] shadow-2xs"
                >
                  <option value="FREE">Free Tier ($0/mo - QR Digital Menu)</option>
                  <option value="PLUS">Plus Tier ($49/mo - Delivery & WhatsApp)</option>
                  <option value="PRO">Pro Tier ($129/mo - POS, KOT & Taste Trip Mobile)</option>
                </select>
              </div>

              {/* Custom Domain */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Custom Domain</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="menu.restaurant.com"
                    value={editingTenant.customDomain || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, customDomain: e.target.value })}
                    className="flex-1 bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#00C8FF] shadow-2xs"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingTenant.customDomainVerified}
                      onChange={(e) => setEditingTenant({ ...editingTenant, customDomainVerified: e.target.checked })}
                      className="rounded accent-[#00A3D9]"
                    />
                    <span>Verified</span>
                  </label>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block mb-1">Feature Entitlements</span>
                
                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                  <span>Online Delivery Orders & Cart</span>
                  <input
                    type="checkbox"
                    checked={editingTenant.deliveryEnabled}
                    onChange={(e) => setEditingTenant({ ...editingTenant, deliveryEnabled: e.target.checked })}
                    className="rounded accent-[#00A3D9]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                  <span>Card Payments Gateway</span>
                  <input
                    type="checkbox"
                    checked={editingTenant.paymentGatewayEnabled}
                    onChange={(e) => setEditingTenant({ ...editingTenant, paymentGatewayEnabled: e.target.checked })}
                    className="rounded accent-[#00A3D9]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                  <span>WhatsApp Order Status Alerts</span>
                  <input
                    type="checkbox"
                    checked={editingTenant.whatsappMessagingEnabled}
                    onChange={(e) => setEditingTenant({ ...editingTenant, whatsappMessagingEnabled: e.target.checked })}
                    className="rounded accent-[#00A3D9]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-800 cursor-pointer p-2 rounded-lg bg-emerald-50/80 border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">AI Chatbot Messaging System (WhatsApp & NLP)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingTenant.hasAiChatbot ?? false}
                    onChange={(e) => setEditingTenant({ ...editingTenant, hasAiChatbot: e.target.checked })}
                    className="rounded accent-emerald-600 w-4 h-4"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00C8FF] hover:bg-[#00B2E3] text-[#0A192F] text-xs font-bold shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Copilot Toggle & Window */}
      {!isFloatingBotOpen && activeTab !== 'AI_COPILOT' && (
        <button
          onClick={() => setIsFloatingBotOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-[#008BB8] to-[#0A192F] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 border border-sky-300/30"
          title="Open Jasmine AI Master Copilot"
        >
          <Bot className="w-5 h-5 text-[#00C8FF]" />
          <span className="text-xs font-bold hidden sm:inline">Jasmine AI Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {isFloatingBotOpen && activeTab !== 'AI_COPILOT' && (
        <CeyteqAiChatbot
          tenants={tenants}
          isFloating
          isOpen={isFloatingBotOpen}
          onClose={() => setIsFloatingBotOpen(false)}
        />
      )}
    </div>
  );
};
