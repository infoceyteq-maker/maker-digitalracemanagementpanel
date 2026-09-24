import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  QrCode, 
  Globe, 
  Check, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Bell, 
  Wifi, 
  Eye, 
  TrendingUp, 
  CheckCircle2, 
  Copy,
  RefreshCw,
  UtensilsCrossed,
  Layers,
  Store,
  DollarSign,
  UserCheck,
  Palette,
  Share2,
  MessageCircle,
  CreditCard,
  ShieldCheck,
  CheckSquare,
  XCircle,
  Bike,
  Sliders,
  ChefHat,
  Bot
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Tenant, Product, Category, WaiterRequest, SubscriptionTier, ThemePalette, UserRole, SocialLinks } from '../types';
import { THEME_PALETTES } from '../lib/themePalettes';
import { WhatsAppBotManager } from './WhatsAppBotManager';

interface RestaurantDashboardProps {
  tenant: Tenant;
  onUpdateTenant: (updated: Tenant) => void;
  onSwitchToPublicMenu: (table?: number) => void;
  waiterCalls: WaiterRequest[];
  onDismissWaiterCall: (callId: string) => void;
  onBackToSuperAdmin?: () => void;
  onOpenTasTripDashboard?: () => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({
  tenant,
  onUpdateTenant,
  onSwitchToPublicMenu,
  waiterCalls,
  onDismissWaiterCall,
  onBackToSuperAdmin,
  onOpenTasTripDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'MENU' | 'CATEGORIES' | 'BRANDING' | 'QR_STUDIO' | 'DOMAIN_SETTINGS' | 'WAITER_CALLS' | 'TIER_ROLES' | 'APPROVALS' | 'TASTRIP_APP' | 'AI_WHATSAPP_BOT'>('MENU');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Tier & RBAC State
  const currentTier: SubscriptionTier = tenant.tier || 'FREE';
  const [activeRole, setActiveRole] = useState<UserRole>(
    currentTier === 'FREE' ? 'ADMIN' : 'MASTER_ADMIN'
  );

  // Social Links State (Free Tier & Above)
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: tenant.socialLinks?.facebook || 'https://facebook.com',
    instagram: tenant.socialLinks?.instagram || 'https://instagram.com',
    tiktok: tenant.socialLinks?.tiktok || 'https://tiktok.com',
    youtube: tenant.socialLinks?.youtube || '',
    whatsapp: tenant.socialLinks?.whatsapp || tenant.phone || '+94770000000',
    showFacebook: tenant.socialLinks?.showFacebook ?? true,
    showInstagram: tenant.socialLinks?.showInstagram ?? true,
    showTiktok: tenant.socialLinks?.showTiktok ?? false,
    showYoutube: tenant.socialLinks?.showYoutube ?? false,
    showWhatsapp: tenant.socialLinks?.showWhatsapp ?? true,
  });

  // Theme Palette Selection (3 Mandatory Themes)
  const [selectedPalette, setSelectedPalette] = useState<ThemePalette>(tenant.palette || 'PALETTE_1');

  // Plus & Pro Add-ons
  const [deliveryEnabled, setDeliveryEnabled] = useState<boolean>(tenant.deliveryEnabled ?? (currentTier !== 'FREE'));
  const [paymentGatewayEnabled, setPaymentGatewayEnabled] = useState<boolean>(tenant.paymentGatewayEnabled ?? (currentTier !== 'FREE'));
  const [whatsappMessagingEnabled, setWhatsappMessagingEnabled] = useState<boolean>(tenant.whatsappMessagingEnabled ?? (currentTier !== 'FREE'));
  const [draftSuccessNotice, setDraftSuccessNotice] = useState<string | null>(null);

  // Category Add State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameSi, setNewCategoryNameSi] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Utensils');

  // Branding Customization State
  const [brandingForm, setBrandingForm] = useState({
    name: tenant.name,
    accentColor: tenant.accentColor || '#e11d48',
    currency: tenant.currency || 'LKR',
    phone: tenant.phone || '',
    address: tenant.address || '',
    wifiSsid: tenant.wifiSsid || '',
    wifiPassword: tenant.wifiPassword || '',
    logoUrl: tenant.logoUrl,
    coverImageUrl: tenant.coverImageUrl,
  });
  const [brandingSaved, setBrandingSaved] = useState(false);
  
  // New Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    nameSi: '',
    description: '',
    descriptionSi: '',
    price: 1500,
    categoryId: tenant.categories[0]?.id || 'cat-1',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    isSpicy: false,
    isVegetarian: false,
    isHalal: true,
  });

  // Inline Price Editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // QR Studio State
  const [selectedTableForQr, setSelectedTableForQr] = useState<number>(4);
  const [qrColor, setQrColor] = useState<string>('#e11d48');
  const [includeLogo, setIncludeLogo] = useState<boolean>(true);

  // Custom Domain Mapping State
  const [customDomainInput, setCustomDomainInput] = useState(tenant.customDomain || '');
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  const [dnsCheckResult, setDnsCheckResult] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Toggle availability instantly
  const handleToggleAvailability = (productId: string) => {
    const updatedProducts = tenant.products.map(p => 
      p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p
    );
    onUpdateTenant({ ...tenant, products: updatedProducts });
  };

  // Start inline price edit
  const startPriceEdit = (p: Product) => {
    setEditingPriceId(p.id);
    setTempPrice(p.price.toString());
  };

  // Save inline price edit
  const savePriceEdit = (productId: string) => {
    const numericPrice = parseFloat(tempPrice);
    if (!isNaN(numericPrice) && numericPrice > 0) {
      const updatedProducts = tenant.products.map(p => 
        p.id === productId ? { ...p, price: numericPrice } : p
      );
      onUpdateTenant({ ...tenant, products: updatedProducts });
    }
    setEditingPriceId(null);
  };

  // Add Product Submit
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    const isFrontDraft = activeRole === 'FRONT';

    const created: Product = {
      id: `p-${Date.now()}`,
      name: newProduct.name,
      nameSi: newProduct.nameSi || '',
      description: newProduct.description || '',
      descriptionSi: newProduct.descriptionSi || '',
      price: Number(newProduct.price),
      currency: tenant.currency,
      categoryId: newProduct.categoryId || tenant.categories[0].id,
      imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
      isAvailable: !isFrontDraft,
      isSpicy: !!newProduct.isSpicy,
      isVegetarian: !!newProduct.isVegetarian,
      isHalal: !!newProduct.isHalal,
      preparationTime: '15 mins',
      approvalStatus: isFrontDraft ? 'PENDING_APPROVAL' : 'PUBLISHED',
      draftedBy: isFrontDraft ? 'Front Staff' : undefined,
    };

    onUpdateTenant({
      ...tenant,
      products: [created, ...tenant.products],
    });

    setIsAddModalOpen(false);
    if (isFrontDraft) {
      setDraftSuccessNotice(`Dish "${newProduct.name}" saved as Draft. Requires Manager or Master Admin approval before going live.`);
      setTimeout(() => setDraftSuccessNotice(null), 4000);
    }

    setNewProduct({
      name: '',
      nameSi: '',
      description: '',
      descriptionSi: '',
      price: 1500,
      categoryId: tenant.categories[0]?.id || 'cat-1',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
      isAvailable: true,
      isSpicy: false,
      isVegetarian: false,
      isHalal: true,
    });
  };

  // Manager/Admin Approve Draft Product
  const handleApproveProduct = (productId: string) => {
    const updated = tenant.products.map(p => 
      p.id === productId 
        ? { ...p, approvalStatus: 'PUBLISHED' as const, isAvailable: true } 
        : p
    );
    onUpdateTenant({ ...tenant, products: updated });
  };

  // Manager/Admin Reject Draft Product
  const handleRejectProduct = (productId: string) => {
    const updated = tenant.products.filter(p => p.id !== productId);
    onUpdateTenant({ ...tenant, products: updated });
  };

  // Switch Tier for this restaurant
  const handleTierChange = (newTier: SubscriptionTier) => {
    const updatedRoles: UserRole = newTier === 'FREE' ? 'ADMIN' : 'MASTER_ADMIN';
    setActiveRole(updatedRoles);
    onUpdateTenant({
      ...tenant,
      tier: newTier,
      deliveryEnabled: newTier !== 'FREE',
      paymentGatewayEnabled: newTier !== 'FREE',
      whatsappMessagingEnabled: newTier !== 'FREE',
    });
  };

  // Save Social Links & Theme Palette
  const handleSaveSocialAndPalette = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant({
      ...tenant,
      palette: selectedPalette,
      socialLinks: socialLinks,
      deliveryEnabled,
      paymentGatewayEnabled,
      whatsappMessagingEnabled,
    });
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 3000);
  };

  // Delete Product
  const handleDeleteProduct = (productId: string) => {
    const updated = tenant.products.filter(p => p.id !== productId);
    onUpdateTenant({ ...tenant, products: updated });
  };

  // DNS Verification Simulation
  const handleVerifyDns = () => {
    setIsCheckingDns(true);
    setDnsCheckResult(null);

    setTimeout(() => {
      setIsCheckingDns(false);
      if (customDomainInput.trim()) {
        const isVerified = true;
        onUpdateTenant({
          ...tenant,
          customDomain: customDomainInput.trim(),
          customDomainVerified: isVerified,
          dnsStatus: 'VERIFIED',
        });
        setDnsCheckResult('DNS records verified successfully! SSL certificate is active.');
      }
    }, 1800);
  };

  const filteredProducts = tenant.products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameSi && p.nameSi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Category Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      nameSi: newCategoryNameSi.trim() || newCategoryName.trim(),
      iconName: newCategoryIcon,
      order: tenant.categories.length + 1,
    };
    onUpdateTenant({
      ...tenant,
      categories: [...tenant.categories, newCat],
    });
    setNewCategoryName('');
    setNewCategoryNameSi('');
  };

  const handleDeleteCategory = (catId: string) => {
    if (tenant.categories.length <= 1) {
      alert("A restaurant must have at least one category.");
      return;
    }
    const updatedCategories = tenant.categories.filter(c => c.id !== catId);
    onUpdateTenant({
      ...tenant,
      categories: updatedCategories,
    });
  };

  // Branding Customization Save Handler
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant({
      ...tenant,
      name: brandingForm.name,
      accentColor: brandingForm.accentColor,
      currency: brandingForm.currency as any,
      phone: brandingForm.phone,
      address: brandingForm.address,
      wifiSsid: brandingForm.wifiSsid,
      wifiPassword: brandingForm.wifiPassword,
      logoUrl: brandingForm.logoUrl,
      coverImageUrl: brandingForm.coverImageUrl,
    });
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 3000);
  };

  // Current target menu URL
  const publicMenuUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?portal=menu&t=${tenant.slug || tenant.subdomain}&table=${selectedTableForQr}&standalone=true`
      : `/?portal=menu&t=${tenant.slug || tenant.subdomain}&table=${selectedTableForQr}&standalone=true`;

  return (
    <div className="min-h-screen text-slate-800 pb-16">
      {/* Top Banner if Navigated from Master Admin */}
      {onBackToSuperAdmin && (
        <div className="bg-gradient-to-r from-pink-50 via-white to-sky-50 border-b border-sky-100 px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600">
              Agency Master Mode: Currently customizing <strong className="text-slate-900">{tenant.name}</strong>
            </span>
            <span className="hidden md:inline text-slate-400">• (රෙස්ටුරන්ට් ඇඩ්මින් පැනලය)</span>
          </div>
          <button
            onClick={onBackToSuperAdmin}
            className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all shadow-xs"
          >
            ← Back to Ceyteq Master Admin
          </button>
        </div>
      )}

      {/* Top Banner / Restaurant Identity Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-sky-100 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img 
              src={tenant.logoUrl} 
              alt={tenant.name}
              className="w-14 h-14 rounded-2xl object-cover border border-sky-200 bg-white shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{tenant.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {tenant.status}
                </span>

                {/* Tier Switcher Dropdown */}
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-sky-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Tier:</span>
                  <select
                    value={currentTier}
                    onChange={(e) => handleTierChange(e.target.value as SubscriptionTier)}
                    className="bg-transparent text-xs font-black text-pink-600 focus:outline-none cursor-pointer"
                  >
                    <option value="FREE" className="bg-white text-slate-900">FREE (Basic QR)</option>
                    <option value="PLUS" className="bg-white text-slate-900">PLUS (Delivery & Roles)</option>
                    <option value="PRO" className="bg-white text-slate-900">PRO (POS + KOT)</option>
                  </select>
                </div>

                {/* Active Role Switcher */}
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-sky-200 shadow-2xs">
                  <UserCheck className="w-3 h-3 text-[#008BB8]" />
                  <span className="text-[10px] text-slate-500 font-bold">Role:</span>
                  <select
                    value={activeRole}
                    onChange={(e) => setActiveRole(e.target.value as UserRole)}
                    className="bg-transparent text-xs font-bold text-[#008BB8] focus:outline-none cursor-pointer"
                  >
                    {currentTier === 'FREE' ? (
                      <>
                        <option value="ADMIN" className="bg-white text-slate-900">Admin</option>
                        <option value="SUBADMIN" className="bg-white text-slate-900">Subadmin</option>
                      </>
                    ) : currentTier === 'PLUS' ? (
                      <>
                        <option value="MASTER_ADMIN" className="bg-white text-slate-900">Master Admin</option>
                        <option value="MANAGER" className="bg-white text-slate-900">Manager</option>
                        <option value="FRONT" className="bg-white text-slate-900">Front Staff (Drafts)</option>
                      </>
                    ) : (
                      <>
                        <option value="MASTER_ADMIN" className="bg-white text-slate-900">Master Admin</option>
                        <option value="MANAGER" className="bg-white text-slate-900">Manager</option>
                        <option value="KITCHEN" className="bg-white text-slate-900">Kitchen</option>
                        <option value="FRONT" className="bg-white text-slate-900">Front / POS</option>
                        <option value="FINANCE" className="bg-white text-slate-900">Finance</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>Subdomain: <strong className="text-slate-700 font-mono">{tenant.subdomain}.ceyteq.com</strong></span>
                {tenant.customDomain && (
                  <>
                    <span>•</span>
                    <span>Custom: <strong className="text-sky-700 font-mono">{tenant.customDomain}</strong></span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSwitchToPublicMenu(selectedTableForQr)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 text-slate-700 text-xs font-semibold border border-sky-200 shadow-2xs transition-all"
            >
              <Eye className="w-4 h-4 text-pink-600" />
              <span>Customer UI</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{activeRole === 'FRONT' ? 'Draft New Dish' : 'Add New Dish'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Total Dishes</span>
              <UtensilsCrossed className="w-4 h-4 text-pink-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{tenant.products.length}</div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">
              {tenant.products.filter(p => p.isAvailable).length} Active in-stock
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Menu Views</span>
              <Eye className="w-4 h-4 text-[#008BB8]" />
            </div>
            <div className="text-2xl font-black text-slate-900">{tenant.totalViews.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-1">Live customer scans</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Active Tables</span>
              <QrCode className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{tenant.tableCount} Tables</div>
            <div className="text-[11px] text-slate-500 mt-1">QR enabled dine-in</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Waiter Calls</span>
              <Bell className="w-4 h-4 text-pink-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {waiterCalls.filter(c => c.status === 'PENDING').length} Pending
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Real-time table alerts</div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="flex items-center gap-2 border-b border-sky-100 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('MENU')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'MENU'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Dishes & Prices</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded-full">{tenant.products.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'CATEGORIES'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories (කැටගරි)</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded-full">{tenant.categories.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('BRANDING')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'BRANDING'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Profile & Branding</span>
          </button>

          <button
            onClick={() => setActiveTab('TIER_ROLES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'TIER_ROLES'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Sliders className="w-4 h-4 text-pink-500" />
            <span>Tier, Themes & Add-ons</span>
            <span className="text-[10px] bg-pink-50 text-pink-700 border border-pink-200 px-1.5 py-0.5 rounded font-mono font-bold">
              {currentTier}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('APPROVALS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative whitespace-nowrap shrink-0 ${
              activeTab === 'APPROVALS'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>Dish Approvals Queue</span>
            {tenant.products.filter(p => p.approvalStatus === 'PENDING_APPROVAL').length > 0 && (
              <span className="bg-amber-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full animate-bounce">
                {tenant.products.filter(p => p.approvalStatus === 'PENDING_APPROVAL').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('QR_STUDIO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'QR_STUDIO'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('DOMAIN_SETTINGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'DOMAIN_SETTINGS'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Custom Domain & DNS</span>
            {tenant.customDomainVerified && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('WAITER_CALLS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'WAITER_CALLS'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Table Alerts</span>
            {waiterCalls.filter(c => c.status === 'PENDING').length > 0 && (
              <span className="bg-amber-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                {waiterCalls.filter(c => c.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('TASTRIP_APP')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative whitespace-nowrap shrink-0 ${
              activeTab === 'TASTRIP_APP'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Bike className="w-4 h-4 text-pink-500" />
            <span>TasTrip Mobile & Delivery</span>
            <span className="text-[9px] bg-pink-50 text-pink-700 border border-pink-200 px-1.5 py-0.5 rounded font-mono font-bold">
              SOLUTION
            </span>
          </button>

          <button
            onClick={() => setActiveTab('AI_WHATSAPP_BOT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative whitespace-nowrap shrink-0 ${
              activeTab === 'AI_WHATSAPP_BOT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-500" />
            <span>WhatsApp AI Bot</span>
            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
              {tenant.hasAiChatbot ? 'ACTIVE' : 'ADD-ON'}
            </span>
          </button>
        </div>

        {/* Notices */}
        <div className="mt-4">
          {activeRole === 'FRONT' && (
            <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl mb-3 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Front Staff Mode:</strong> Any dishes you draft will be held in the <strong>Dish Approvals Queue</strong> until approved by a Manager or Master Admin.
                </span>
              </div>
              <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded font-mono font-bold text-amber-900">FRONT DRAFTING</span>
            </div>
          )}
          {draftSuccessNotice && (
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl mb-3 flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{draftSuccessNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: MENU MANAGER */}
      {activeTab === 'MENU' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food items or Sinhala names..."
                className="w-full bg-white border border-sky-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-sky-200'
                }`}
              >
                All Categories
              </button>
              {tenant.categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-sky-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dish Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const isEditingPrice = editingPriceId === product.id;
              return (
                <div 
                  key={product.id}
                  className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-4 flex flex-col justify-between hover:border-pink-300 hover:shadow-md transition-all shadow-sm"
                >
                  <div>
                    <div className="relative h-40 w-full rounded-xl overflow-hidden mb-3 bg-slate-100 border border-slate-100">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {!product.isAvailable && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-md border border-pink-200 shadow-2xs">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {product.isSpicy && (
                          <span className="bg-white/90 backdrop-blur-sm text-amber-700 font-semibold border border-amber-200 p-1 rounded-md text-[10px] shadow-2xs">
                            Spicy 🔥
                          </span>
                        )}
                        {product.isHalal && (
                          <span className="bg-white/90 backdrop-blur-sm text-emerald-700 font-semibold border border-emerald-200 p-1 rounded-md text-[10px] shadow-2xs">
                            Halal 🟢
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{product.name}</h3>
                        {product.nameSi && (
                          <p className="text-xs text-slate-500 font-normal">{product.nameSi}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-sky-100 space-y-3">
                    {/* Inline Price Editing */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Price ({tenant.currency})</span>
                      {isEditingPrice ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            className="w-24 bg-white border border-pink-500 rounded px-2 py-0.5 text-xs text-slate-900 font-mono text-right focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => savePriceEdit(product.id)}
                            className="w-6 h-6 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startPriceEdit(product)}
                          className="flex items-center gap-1.5 text-sm font-black text-slate-900 hover:text-pink-600 font-mono transition-colors"
                          title="Click to change price instantly"
                        >
                          <span>{product.price.toLocaleString()}</span>
                          <Edit3 className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>

                    {/* Stock Switch & Delete */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={product.isAvailable}
                          onChange={() => handleToggleAvailability(product.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                        <span className={product.isAvailable ? "text-emerald-700 font-medium" : "text-slate-400"}>
                          {product.isAvailable ? "In Stock" : "Unavailable"}
                        </span>
                      </label>

                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-slate-400 hover:text-pink-600 p-1.5 rounded-lg hover:bg-pink-50 transition-colors"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: CATEGORIES MANAGER */}
      {activeTab === 'CATEGORIES' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Add New Category */}
            <div className="md:col-span-5 bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-pink-600" />
                <span>Add New Category</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Organize your menu into distinct sections with English and Sinhala translations.
              </p>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Category Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Seafood Specials, Juices, Desserts"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Category Name in Sinhala (සිංහල නම)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. මුහුදු ආහාර, බීම වර්ග, කෙටි කෑම"
                    value={newCategoryNameSi}
                    onChange={(e) => setNewCategoryNameSi(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Category Icon Style
                  </label>
                  <select
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  >
                    <option value="Utensils">Utensils (General Food)</option>
                    <option value="Flame">Flame (Spicy / BBQ / Kottu)</option>
                    <option value="Fish">Fish (Seafood)</option>
                    <option value="Coffee">Coffee (Beverages & Cafes)</option>
                    <option value="IceCream">IceCream (Desserts & Sweets)</option>
                    <option value="Sparkles">Sparkles (Chef Specials)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-xs transition-all"
                >
                  Create Menu Category
                </button>
              </form>
            </div>

            {/* Right: Existing Categories List */}
            <div className="md:col-span-7 bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current Categories ({tenant.categories.length})</h3>
                  <p className="text-xs text-slate-500">Categories live on customer digital QR menus</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {tenant.categories.map((cat, idx) => {
                  const itemCount = tenant.products.filter(p => p.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-sky-100 shadow-2xs hover:border-pink-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xs border border-pink-100">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                            {cat.nameSi && (
                              <span className="text-xs text-pink-600 font-medium">({cat.nameSi})</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {itemCount} {itemCount === 1 ? 'dish' : 'dishes'} assigned
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-slate-400 hover:text-pink-600 p-2 rounded-lg hover:bg-pink-50 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BRANDING & RESTAURANT CUSTOMIZATION */}
      {activeTab === 'BRANDING' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-6">
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-pink-600" />
                  <span>Restaurant Profile & Brand Customization</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  (රෙස්ටුරන්ට් එකේ නම, පාට, WiFi සහ විස්තර වෙනස් කරන්න):
                  Customize how your restaurant appears to customers when they scan your QR code.
                </p>
              </div>

              {brandingSaved && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved to Digital Menu!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Restaurant Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandingForm.name}
                    onChange={(e) => setBrandingForm({ ...brandingForm, name: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Default Currency
                  </label>
                  <select
                    value={brandingForm.currency}
                    onChange={(e) => setBrandingForm({ ...brandingForm, currency: e.target.value as any })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  >
                    <option value="LKR">LKR (Sri Lankan Rupee - රු.)</option>
                    <option value="USD">USD ($)</option>
                    <option value="AED">AED (Dirham)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Accent Color Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Theme Accent Color (Branding Color)
                </label>
                <div className="flex items-center gap-3">
                  {['#e11d48', '#0284c7', '#16a34a', '#f59e0b', '#8b5cf6', '#ea580c'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBrandingForm({ ...brandingForm, accentColor: color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        brandingForm.accentColor === color
                          ? 'border-slate-800 scale-110 shadow-md'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="text"
                    value={brandingForm.accentColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                    className="w-28 bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Contact & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={brandingForm.phone}
                    onChange={(e) => setBrandingForm({ ...brandingForm, phone: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Restaurant Address
                  </label>
                  <input
                    type="text"
                    value={brandingForm.address}
                    onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Guest WiFi Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Guest WiFi Network (SSID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CeylonSpice_Guest"
                    value={brandingForm.wifiSsid}
                    onChange={(e) => setBrandingForm({ ...brandingForm, wifiSsid: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Guest WiFi Password
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. diningfree2026"
                    value={brandingForm.wifiPassword}
                    onChange={(e) => setBrandingForm({ ...brandingForm, wifiPassword: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Image URLs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    value={brandingForm.logoUrl}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Cover Banner Image URL
                  </label>
                  <input
                    type="url"
                    value={brandingForm.coverImageUrl}
                    onChange={(e) => setBrandingForm({ ...brandingForm, coverImageUrl: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-sky-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-xs transition-all"
                >
                  Save Profile & Branding Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: TIER, ROLES & PALETTES */}
      {activeTab === 'TIER_ROLES' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
          {/* Section 1: SaaS Subscription Tier */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-pink-600" />
                  <span>Subscription Tier & Access Level</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Digital Race multi-tenant restaurant tiers. Toggle tiers below to preview and test unlocked features.
                </p>
              </div>
              <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full font-bold bg-pink-50 text-pink-700 border border-pink-200">
                Current: {currentTier} PLAN
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Tier Card */}
              <div className={`p-5 rounded-2xl border transition-all ${
                currentTier === 'FREE' 
                  ? 'bg-pink-50/40 border-pink-500/80 shadow-md ring-1 ring-pink-500/40' 
                  : 'bg-white border-sky-100 hover:border-sky-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Tier 1</span>
                  {currentTier === 'FREE' && (
                    <span className="text-[10px] font-bold bg-pink-600 text-white px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900">Free Starter</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Core QR generation & basic digital menu.</p>
                <div className="text-2xl font-black text-slate-900 mb-4">
                  Rs. 0 <span className="text-xs font-normal text-slate-400">/mo</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dynamic Table QR Scanner</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Basic Digital Menu Catalog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>5 Social Media Links & WiFi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2 Roles: Admin, Subadmin</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3 Mandatory Theme Palettes</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleTierChange('FREE')}
                  disabled={currentTier === 'FREE'}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTier === 'FREE'
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-pink-600 hover:bg-pink-500 text-white shadow-xs'
                  }`}
                >
                  {currentTier === 'FREE' ? 'Current Tier' : 'Switch to Free'}
                </button>
              </div>

              {/* Plus Tier Card */}
              <div className={`p-5 rounded-2xl border transition-all ${
                currentTier === 'PLUS' 
                  ? 'bg-sky-50/50 border-sky-500/80 shadow-md ring-1 ring-sky-500/40' 
                  : 'bg-white border-sky-100 hover:border-sky-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-sky-700 uppercase tracking-wider">Tier 2</span>
                  {currentTier === 'PLUS' && (
                    <span className="text-[10px] font-bold bg-[#008BB8] text-white px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900">Plus Business</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Delivery, WhatsApp, and 3-Role workflow.</p>
                <div className="text-2xl font-black text-slate-900 mb-4">
                  Rs. 6,500 <span className="text-xs font-normal text-slate-400">/mo</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#008BB8]" />
                    <span>All Free Tier Features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#008BB8]" />
                    <span>Delivery & Remote Ordering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#008BB8]" />
                    <span>WhatsApp Order Notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#008BB8]" />
                    <span>Card Payment Gateway (Stripe)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#008BB8]" />
                    <span>3 Roles: Master, Manager, Front</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#008BB8]" />
                    <span>Front Staff Draft Approvals</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleTierChange('PLUS')}
                  disabled={currentTier === 'PLUS'}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTier === 'PLUS'
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-[#008BB8] hover:bg-sky-600 text-white shadow-xs'
                  }`}
                >
                  {currentTier === 'PLUS' ? 'Current Tier' : 'Upgrade to Plus'}
                </button>
              </div>

              {/* Pro Tier Card */}
              <div className={`p-5 rounded-2xl border transition-all ${
                currentTier === 'PRO' 
                  ? 'bg-amber-50/50 border-amber-500/80 shadow-md ring-1 ring-amber-500/40' 
                  : 'bg-white border-sky-100 hover:border-sky-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Tier 3 • Full Suite</span>
                  {currentTier === 'PRO' && (
                    <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900">Pro Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Complete POS, Live KOT & Finance reconciliations.</p>
                <div className="text-2xl font-black text-slate-900 mb-4">
                  Rs. 14,500 <span className="text-xs font-normal text-slate-400">/mo</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>All Plus Tier Features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>Walk-in Cloud POS Terminal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>Real-time Kitchen Order (KOT) Board</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>80mm Thermal Bill Printing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>Daily Financial Reconciliation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>5 Roles: Master, Manager, Kitchen, Front, Finance</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleTierChange('PRO')}
                  disabled={currentTier === 'PRO'}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTier === 'PRO'
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                  }`}
                >
                  {currentTier === 'PRO' ? 'Current Tier' : 'Upgrade to Pro'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: 3 Mandatory Theme Palettes */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-pink-600" />
                  <span>3 Pre-configured Color Palettes (Theme Support)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customers viewing the digital QR menu will experience this bespoke color hierarchy.
                </p>
              </div>
              <span className="text-xs text-pink-600 font-semibold">Active: {THEME_PALETTES[selectedPalette].name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(THEME_PALETTES) as ThemePalette[]).map((paletteKey) => {
                const pal = THEME_PALETTES[paletteKey];
                const isSelected = selectedPalette === paletteKey;
                return (
                  <div
                    key={paletteKey}
                    onClick={() => setSelectedPalette(paletteKey)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50/30 ring-2 ring-pink-500/30 shadow-md'
                        : 'border-sky-100 bg-white hover:border-sky-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">{pal.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-pink-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">{pal.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg shadow-xs" style={{ backgroundColor: pal.sampleHex.accent }} />
                      <span className="w-6 h-6 rounded-lg border border-slate-200" style={{ backgroundColor: pal.sampleHex.hash }} />
                      <span className="w-6 h-6 rounded-lg border border-slate-200" style={{ backgroundColor: pal.sampleHex.base }} />
                      <span className="text-[10px] font-mono text-slate-400 ml-auto">{pal.sampleHex.accent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Social Media Toggles (Free Tier & Above) */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-pink-600" />
              <span>5 Social Media Integrations & Public Links</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Toggle visibility and provide your restaurant's social links displayed on the Customer Digital Menu footer.
            </p>

            <div className="space-y-4">
              {/* Facebook */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showFb"
                    checked={socialLinks.showFacebook}
                    onChange={(e) => setSocialLinks({ ...socialLinks, showFacebook: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="showFb" className="text-xs font-semibold text-slate-900">Facebook Page</label>
                </div>
                <input
                  type="url"
                  placeholder="https://facebook.com/myrestaurant"
                  value={socialLinks.facebook}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  className="w-full sm:w-80 bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Instagram */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showIg"
                    checked={socialLinks.showInstagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, showInstagram: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="showIg" className="text-xs font-semibold text-slate-900">Instagram Profile</label>
                </div>
                <input
                  type="url"
                  placeholder="https://instagram.com/myrestaurant"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  className="w-full sm:w-80 bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* TikTok */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showTk"
                    checked={socialLinks.showTiktok}
                    onChange={(e) => setSocialLinks({ ...socialLinks, showTiktok: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="showTk" className="text-xs font-semibold text-slate-900">TikTok Channel</label>
                </div>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@myrestaurant"
                  value={socialLinks.tiktok}
                  onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                  className="w-full sm:w-80 bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* YouTube */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showYt"
                    checked={socialLinks.showYoutube}
                    onChange={(e) => setSocialLinks({ ...socialLinks, showYoutube: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="showYt" className="text-xs font-semibold text-slate-900">YouTube Channel</label>
                </div>
                <input
                  type="url"
                  placeholder="https://youtube.com/@myrestaurant"
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  className="w-full sm:w-80 bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* WhatsApp Direct */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showWa"
                    checked={socialLinks.showWhatsapp}
                    onChange={(e) => setSocialLinks({ ...socialLinks, showWhatsapp: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="showWa" className="text-xs font-semibold text-slate-900">WhatsApp Direct Chat</label>
                </div>
                <input
                  type="text"
                  placeholder="+94771234567"
                  value={socialLinks.whatsapp}
                  onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })}
                  className="w-full sm:w-80 bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Plus & Pro Operational Modules */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-pink-600" />
              <span>Plus & Pro Operational Feature Toggles</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Configure online ordering, payment gateways, and WhatsApp real-time dispatch alerts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Delivery Ordering */}
              <div className="p-4 rounded-xl bg-white border border-sky-100 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Bike className="w-4 h-4 text-emerald-600" />
                      <span>Delivery Orders</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={deliveryEnabled}
                      onChange={(e) => setDeliveryEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Allow customers to switch between Dine-in and Delivery / Remote ordering on the customer menu.
                  </p>
                </div>
                <span className={`text-[10px] mt-3 font-bold ${deliveryEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {deliveryEnabled ? '● Enabled on Customer UI' : '○ Disabled'}
                </span>
              </div>

              {/* Card Payment Gateway */}
              <div className="p-4 rounded-xl bg-white border border-sky-100 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#008BB8]" />
                      <span>Card Payment (Stripe/PayHere)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={paymentGatewayEnabled}
                      onChange={(e) => setPaymentGatewayEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Enable integrated Visa, Mastercard, and digital checkout modal for remote and delivery orders.
                  </p>
                </div>
                <span className={`text-[10px] mt-3 font-bold ${paymentGatewayEnabled ? 'text-sky-700' : 'text-slate-400'}`}>
                  {paymentGatewayEnabled ? '● Gateway Active' : '○ Cash on Delivery Only'}
                </span>
              </div>

              {/* WhatsApp Dispatch */}
              <div className="p-4 rounded-xl bg-white border border-sky-100 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Alerts</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={whatsappMessagingEnabled}
                      onChange={(e) => setWhatsappMessagingEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Send real-time order confirmation and kitchen dispatch status updates to the customer's WhatsApp number.
                  </p>
                </div>
                <span className={`text-[10px] mt-3 font-bold ${whatsappMessagingEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {whatsappMessagingEnabled ? '● Auto-Messaging Active' : '○ Disabled'}
                </span>
              </div>

              {/* WhatsApp AI Chatbot Add-on */}
              <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp AI Concierge</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={tenant.hasAiChatbot ?? false}
                      onChange={(e) => {
                        onUpdateTenant({
                          ...tenant,
                          hasAiChatbot: e.target.checked,
                          aiChatbotConfig: {
                            ...tenant.aiChatbotConfig,
                            enabled: e.target.checked,
                            autoReplyEnabled: e.target.checked,
                          } as any,
                        });
                      }}
                      className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Natural language AI bot on WhatsApp handling menu questions, spicy levels, reservations & orders via Gemini.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[10px] font-bold ${tenant.hasAiChatbot ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {tenant.hasAiChatbot ? '● AI Bot Configured' : '○ Add-on Disabled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('AI_WHATSAPP_BOT')}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Open Bot Studio →
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-sky-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSocialAndPalette}
                className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-xs transition-all"
              >
                Save Tier, Themes & Add-on Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: APPROVALS QUEUE */}
      {activeTab === 'APPROVALS' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                  <span>Dish Draft Approvals Queue</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  In Plus & Pro tiers, Front Staff (Counter) draft new dishes. Managers or Master Admins review and approve them before they appear on the public menu.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  {tenant.products.filter(p => p.approvalStatus === 'PENDING_APPROVAL').length} Pending Drafts
                </span>
              </div>
            </div>

            {tenant.products.filter(p => p.approvalStatus === 'PENDING_APPROVAL').length === 0 ? (
              <div className="py-12 text-center bg-sky-50/40 rounded-xl border border-dashed border-sky-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/70 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900">No Pending Drafts</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
                  All menu items are currently reviewed and published live on the public QR menu.
                </p>
                {activeRole !== 'FRONT' && (
                  <button
                    onClick={() => {
                      setActiveRole('FRONT');
                      setIsAddModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-sky-200 shadow-2xs transition-all"
                  >
                    Simulate Front Staff Drafting a Dish
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenant.products
                  .filter(p => p.approvalStatus === 'PENDING_APPROVAL')
                  .map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded">
                                DRAFT
                              </span>
                            </div>
                            {product.nameSi && (
                              <p className="text-xs text-slate-500">{product.nameSi}</p>
                            )}
                            <p className="text-xs font-mono font-bold text-pink-600 mt-1">
                              {tenant.currency} {product.price.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {product.description || 'No description provided.'}
                        </p>

                        <div className="text-[11px] text-slate-500 mb-4">
                          Drafted by: <strong className="text-slate-800">{product.draftedBy || 'Front Staff'}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleApproveProduct(product.id)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Publish Live</span>
                        </button>
                        <button
                          onClick={() => handleRejectProduct(product.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: QR_STUDIO */}
      {activeTab === 'QR_STUDIO' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Controls */}
            <div className="md:col-span-6 bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 space-y-6 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-pink-600" />
                  <span>Dynamic Table QR Code Generator</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Generate high-resolution scannable QR codes encoded with table numbers.
                </p>
              </div>

              {/* Table Number Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Select Table Number
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedTableForQr(num)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedTableForQr === num
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-pink-50 border border-sky-200'
                      }`}
                    >
                      #{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Color */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  QR Foreground Accent
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { color: '#e11d48', name: 'Rose' },
                    { color: '#0284c7', name: 'Sky' },
                    { color: '#16a34a', name: 'Emerald' },
                    { color: '#0f172a', name: 'Dark Slate' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setQrColor(c.color)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform ${
                        qrColor === c.color ? 'ring-2 ring-slate-800 scale-105' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    >
                      {qrColor === c.color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo in Center toggle */}
              <div className="flex items-center justify-between py-2 border-t border-sky-100">
                <span className="text-xs font-medium text-slate-700">Center Restaurant Logo</span>
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="w-4 h-4 accent-pink-600 rounded"
                />
              </div>

              {/* URL Preview */}
              <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
                <div className="text-[11px] text-slate-500">Target Scanned URL</div>
                <div className="text-xs font-mono text-[#008BB8] break-all mt-0.5">
                  {publicMenuUrl}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onSwitchToPublicMenu(selectedTableForQr)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-xs"
                >
                  <Eye className="w-4 h-4 text-pink-400" />
                  <span>Test Scan in Browser</span>
                </button>
              </div>
            </div>

            {/* Right: Realistic Table Tent / Card Preview */}
            <div className="md:col-span-6 flex flex-col items-center">
              <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-md w-full max-w-sm flex flex-col items-center text-center border-2 border-sky-100">
                {/* Tent Header */}
                <img 
                  src={tenant.logoUrl} 
                  alt={tenant.name}
                  className="w-14 h-14 rounded-2xl object-cover shadow-xs mb-2 border border-slate-100"
                />
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{tenant.name}</h3>
                <p className="text-xs text-slate-500 font-medium">Scan for Contactless Digital Menu</p>

                {/* Table Badge */}
                <div className="my-3 px-4 py-1 rounded-full bg-pink-50 text-pink-700 font-extrabold text-sm border border-pink-200">
                  Table #{selectedTableForQr}
                </div>

                {/* Live Real QR Code */}
                <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-xs my-1">
                  <QRCodeSVG
                    value={publicMenuUrl}
                    size={180}
                    fgColor={qrColor}
                    level="H"
                    imageSettings={includeLogo ? {
                      src: tenant.logoUrl,
                      x: undefined,
                      y: undefined,
                      height: 38,
                      width: 38,
                      excavate: true,
                    } : undefined}
                  />
                </div>

                <div className="mt-3 text-[11px] text-slate-500 font-medium">
                  Instant ordering • No app download required
                </div>

                {/* WiFi Credentials on Card */}
                {tenant.wifiSsid && (
                  <div className="mt-3 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-xs text-slate-600 font-mono">
                    <Wifi className="w-3.5 h-3.5 text-sky-600" />
                    <span>WiFi: <strong>{tenant.wifiSsid}</strong></span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => alert(`Table #${selectedTableForQr} High-Resolution Printable PDF / SVG downloaded!`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 shadow-xs"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download SVG / PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOMAIN & DNS SETTINGS */}
      {activeTab === 'DOMAIN_SETTINGS' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-6">
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#008BB8]" />
                <span>Domain Routing & Custom Domain Mapping</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your restaurant's digital presence. Every tenant starts with a free Ceyteq subdomain, and can route their own branded domain anytime.
              </p>
            </div>

            {/* 1. Default Subdomain */}
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Default Subdomain (Included)</span>
                <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  https://{tenant.subdomain}.ceyteq.com
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Always active with wild-card SSL certificates automatically managed by Ceyteq.</p>
              </div>
              <button
                onClick={() => handleCopy(`https://${tenant.subdomain}.ceyteq.com`, 'subdomain')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-sky-200 text-slate-700 text-xs font-semibold shrink-0 shadow-2xs"
              >
                {copiedText === 'subdomain' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText === 'subdomain' ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>

            {/* 2. Custom Domain Mapping */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Custom Domain (CNAME Mapping)</h3>
                  <p className="text-xs text-slate-500">Map your own restaurant website or subdomain (e.g. menu.ceylonspice.com)</p>
                </div>
                {tenant.customDomainVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified & Active SSL
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Pending DNS Propagation
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  placeholder="e.g. menu.myrestaurant.com"
                  className="flex-1 bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-[#008BB8]"
                />
                <button
                  onClick={handleVerifyDns}
                  disabled={isCheckingDns || !customDomainInput}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#008BB8] hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDns ? 'animate-spin' : ''}`} />
                  <span>{isCheckingDns ? 'Checking DNS...' : 'Verify DNS'}</span>
                </button>
              </div>

              {dnsCheckResult && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{dnsCheckResult}</span>
                </div>
              )}

              {/* DNS Instructions Box */}
              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  How to configure DNS at your registrar (GoDaddy, Namecheap, Cloudflare, LK Domain Registry)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="border-b border-sky-200 text-slate-500">
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Name / Host</th>
                        <th className="pb-2">Target Value</th>
                        <th className="pb-2">TTL</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      <tr>
                        <td className="py-2 text-[#008BB8] font-bold">CNAME</td>
                        <td className="py-2 text-slate-900">menu</td>
                        <td className="py-2 text-pink-600 font-bold">{tenant.dnsExpectedCname}</td>
                        <td className="py-2 text-slate-500">Automatic / 3600</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-500">
                  Once added, Ceyteq's Next.js middleware automatically recognizes incoming requests for this domain and serves your digital menu with auto-renewing SSL encryption.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WAITER CALLS / ALERTS */}
      {activeTab === 'WAITER_CALLS' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-6">
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  <span>Live Table Pings & Waiter Calls</span>
                </h2>
                <p className="text-xs text-slate-500">Audio pings received when customers click 'Call Waiter' or 'Bill'</p>
              </div>
            </div>

            {waiterCalls.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-sky-50/30 rounded-xl border border-dashed border-sky-100">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-sm font-semibold text-slate-600">No table calls at this moment</p>
                <p className="text-xs text-slate-400 mt-1">Staff will receive sound alerts here when guests scan and request service</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waiterCalls.map((call) => (
                  <div
                    key={call.id}
                    className="p-4 rounded-xl bg-white border border-sky-100 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-sm">
                        #{call.tableNumber}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {call.type === 'CALL_WAITER' && '🙋 Assistance Requested'}
                          {call.type === 'REQUEST_BILL' && '💳 Requesting Final Bill'}
                          {call.type === 'WATER_REFILL' && '💧 Complimentary Water'}
                        </h4>
                        <p className="text-xs text-slate-400">{call.timestamp}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onDismissWaiterCall(call.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Attended</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: TASTRIP MOBILE & DELIVERY SOLUTION */}
      {activeTab === 'TASTRIP_APP' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          {/* Solution Banner */}
          <div className="bg-gradient-to-r from-sky-50 via-pink-50/50 to-sky-100/60 border border-pink-200/70 rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-pink-600 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Digital Race Business Solution</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Bike className="w-6 h-6 text-pink-600" />
                  <span>TasTrip Mobile Ordering & Delivery</span>
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  TasTrip is your custom-branded native iOS & Android mobile application powered by the Digital Race platform. It delivers real-time menu synchronization, customer ordering with card payments, and live courier GPS tracking.
                </p>
              </div>

              {onOpenTasTripDashboard && (
                <button
                  onClick={onOpenTasTripDashboard}
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-xs flex items-center gap-2 shrink-0 transition-all"
                >
                  <span>Open Dedicated TasTrip Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* App Status & Specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-500">Branded App Identifier</span>
              <p className="text-sm font-bold text-slate-900 font-mono mt-1 truncate">
                com.ceyteq.tastrip.{tenant.subdomain}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Live on App Store & Google Play</span>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-500">Rider Fleet Dispatch</span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                TasTrip Colombo Central Fleet
              </p>
              <span className="text-xs text-[#008BB8] font-semibold mt-3 block">
                Avg ETA: 24 mins • High-accuracy GPS
              </span>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <span className="text-xs text-slate-500">Monthly Mobile GMV</span>
              <p className="text-lg font-black text-pink-600 font-mono mt-1">
                Rs. 842,500
              </p>
              <span className="text-xs text-slate-500 mt-3 block">
                342 Orders processed via TasTrip
              </span>
            </div>
          </div>

          {/* Feature Configuration */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-600" />
              <span>Restaurant TasTrip Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-sky-50/40 border border-sky-100 space-y-2">
                <span className="font-bold text-slate-900 block">Delivery Radius (Colombo Metro)</span>
                <p className="text-slate-500">Radius around restaurant location where orders will be accepted.</p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[#008BB8] font-bold">
                  <span>8.5 km radius</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-600">Active</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/40 border border-sky-100 space-y-2">
                <span className="font-bold text-slate-900 block">Customer Delivery Fee</span>
                <p className="text-slate-500">Fee charged to the customer at mobile checkout.</p>
                <div className="flex items-center gap-2 pt-1 font-mono text-pink-600 font-bold">
                  <span>Rs. 350 Flat Fee</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">Dynamic Distance Mode</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-sky-100 flex flex-wrap gap-3">
              {onOpenTasTripDashboard && (
                <button
                  onClick={onOpenTasTripDashboard}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                >
                  <Bike className="w-4 h-4" />
                  <span>Launch TasTrip Driver Radar & Fleet Cockpit</span>
                </button>
              )}
              <button
                onClick={() => onSwitchToPublicMenu()}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 border border-sky-200 shadow-2xs transition-all"
              >
                <Eye className="w-4 h-4 text-pink-600" />
                <span>Preview Customer Menu Web View</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: WHATSAPP AI CHATBOT MESSAGING SYSTEM */}
      {activeTab === 'AI_WHATSAPP_BOT' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-6">
          <WhatsAppBotManager tenant={tenant} onUpdateTenant={onUpdateTenant} />
        </div>
      )}

      {/* Add New Dish Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 mb-1">Add New Menu Dish</h2>
            <p className="text-xs text-slate-500 mb-4">Add a new item to your digital QR menu instantly without IT help.</p>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Dish Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seafood Fried Rice"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Dish Name (Sinhala - Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. සීෆුඩ් ෆ්‍රයිඩ් රයිස්"
                  value={newProduct.nameSi}
                  onChange={(e) => setNewProduct({ ...newProduct, nameSi: e.target.value })}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Price ({tenant.currency})</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  >
                    {tenant.categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, preparation, sauce..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Dietary Tags */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.isSpicy}
                    onChange={(e) => setNewProduct({ ...newProduct, isSpicy: e.target.checked })}
                    className="rounded accent-amber-500"
                  />
                  <span>Spicy 🔥</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.isVegetarian}
                    onChange={(e) => setNewProduct({ ...newProduct, isVegetarian: e.target.checked })}
                    className="rounded accent-emerald-500"
                  />
                  <span>Vegetarian 🌱</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.isHalal}
                    onChange={(e) => setNewProduct({ ...newProduct, isHalal: e.target.checked })}
                    className="rounded accent-blue-500"
                  />
                  <span>Halal 🟢</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white shadow-xs transition-colors"
                >
                  Publish Dish to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
