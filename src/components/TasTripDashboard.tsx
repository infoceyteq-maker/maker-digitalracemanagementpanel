import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Bike, 
  ShieldCheck, 
  Code2, 
  MapPin, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Navigation, 
  Clock, 
  Copy, 
  Check, 
  Store, 
  Play, 
  Compass, 
  ExternalLink,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  UserCheck,
  CheckSquare,
  Building2
} from 'lucide-react';
import { Tenant, DeliveryDriver, TasteTripDeployment } from '../types';
import { 
  MOBILE_APP_ARCHITECTURE_GUIDE,
  DRIVER_UI_REACT_NATIVE_BOILERPLATE,
  CLIENT_UI_REACT_NATIVE_BOILERPLATE,
  NEXTJS_CEYTEQ_MASTER_PANEL_BOILERPLATE
} from '../lib/tasTripArchitectureCode';

interface TasTripDashboardProps {
  tenants: Tenant[];
  drivers: DeliveryDriver[];
  deployments: TasteTripDeployment[];
  onBackToDigitalRace?: () => void;
  onSelectTenant?: (tenantId: string) => void;
}

export const TasTripDashboard: React.FC<TasTripDashboardProps> = ({
  tenants,
  drivers: initialDrivers,
  deployments: initialDeployments,
  onBackToDigitalRace,
  onSelectTenant
}) => {
  // Navigation tabs within the dedicated TasTrip Dashboard
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CUSTOMER_APP' | 'DRIVER_COCKPIT' | 'FLEET_ROSTER' | 'EAS_BUILDS' | 'TECH_CODE'>('OVERVIEW');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ----------------------------------------------------
  // CLIENT APP SIMULATOR STATE
  // ----------------------------------------------------
  const proTenants = tenants.filter(t => t.tier === 'PRO' || t.plan === 'PRO');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(proTenants[0]?.id || tenants[0]?.id);
  const activeTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];

  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [clientCart, setClientCart] = useState<{ [id: string]: number }>({});
  const [isClientCheckoutOpen, setIsClientCheckoutOpen] = useState(false);
  const [clientActiveOrder, setClientActiveOrder] = useState<{
    id: string;
    itemsCount: number;
    total: number;
    status: 'PLACED' | 'PREPARING' | 'PICKED_UP' | 'DELIVERED';
    driverName: string;
    driverPhone: string;
    etaMinutes: number;
  } | null>(null);

  const addToCart = (prodId: string) => {
    setClientCart(prev => ({ ...prev, [prodId]: (prev[prodId] || 0) + 1 }));
  };

  const removeFromCart = (prodId: string) => {
    setClientCart(prev => {
      const copy = { ...prev };
      if (copy[prodId] > 1) {
        copy[prodId] -= 1;
      } else {
        delete copy[prodId];
      }
      return copy;
    });
  };

  const cartTotal = Object.entries(clientCart).reduce((sum, [prodId, qty]) => {
    const p = activeTenant.products.find(item => item.id === prodId);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const deliveryFee = orderType === 'DELIVERY' ? 350 : 0;
  const grandTotal = cartTotal + deliveryFee;

  const handleClientPlaceOrder = () => {
    setIsClientCheckoutOpen(false);
    setClientActiveOrder({
      id: `TT-#${Math.floor(100 + Math.random() * 900)}`,
      itemsCount: Object.values(clientCart).reduce((a, b) => a + b, 0),
      total: grandTotal,
      status: 'PLACED',
      driverName: 'Suresh Jayawardena',
      driverPhone: '+94 77 412 8899',
      etaMinutes: 24,
    });
    setClientCart({});

    // Simulate order progress
    setTimeout(() => {
      setClientActiveOrder(prev => prev ? { ...prev, status: 'PREPARING', etaMinutes: 20 } : null);
    }, 4000);
    setTimeout(() => {
      setClientActiveOrder(prev => prev ? { ...prev, status: 'PICKED_UP', etaMinutes: 12 } : null);
    }, 9000);
    setTimeout(() => {
      setClientActiveOrder(prev => prev ? { ...prev, status: 'DELIVERED', etaMinutes: 0 } : null);
    }, 16000);
  };

  // ----------------------------------------------------
  // DRIVER COCKPIT SIMULATOR STATE
  // ----------------------------------------------------
  const [driverOnline, setDriverOnline] = useState(true);
  const [driverRadarOrder, setDriverRadarOrder] = useState<{
    id: string;
    orderNum: string;
    restaurant: string;
    customer: string;
    address: string;
    distanceKm: number;
    earnings: number;
  } | null>(null);
  const [driverActiveTrip, setDriverActiveTrip] = useState<{
    id: string;
    orderNum: string;
    restaurant: string;
    customer: string;
    phone: string;
    address: string;
    earnings: number;
    step: 'AT_RESTAURANT' | 'PICKED_UP' | 'COMPLETED';
    courierProgress: number;
  } | null>(null);
  const [radarCountdown, setRadarCountdown] = useState(30);

  // Trigger radar order simulation when online
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (driverOnline && !driverActiveTrip && !driverRadarOrder) {
      timer = setTimeout(() => {
        setDriverRadarOrder({
          id: 'ord-rad-901',
          orderNum: 'TT-#512',
          restaurant: activeTenant.name,
          customer: 'Kasun Rathnayake',
          address: '28/4 Horton Place, Colombo 07',
          distanceKm: 3.2,
          earnings: 680,
        });
        setRadarCountdown(30);
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [driverOnline, driverActiveTrip, driverRadarOrder, activeTenant]);

  // Radar Countdown
  useEffect(() => {
    if (driverRadarOrder && radarCountdown > 0) {
      const interval = setInterval(() => setRadarCountdown(c => c - 1), 1000);
      return () => clearInterval(interval);
    } else if (radarCountdown === 0 && driverRadarOrder) {
      setDriverRadarOrder(null);
    }
  }, [driverRadarOrder, radarCountdown]);

  const handleDriverAccept = () => {
    if (!driverRadarOrder) return;
    setDriverActiveTrip({
      id: driverRadarOrder.id,
      orderNum: driverRadarOrder.orderNum,
      restaurant: driverRadarOrder.restaurant,
      customer: driverRadarOrder.customer,
      phone: '+94 77 998 1234',
      address: driverRadarOrder.address,
      earnings: driverRadarOrder.earnings,
      step: 'AT_RESTAURANT',
      courierProgress: 20,
    });
    setDriverRadarOrder(null);
  };

  // ----------------------------------------------------
  // FLEET & DEPLOYMENTS STATE
  // ----------------------------------------------------
  const [deploymentsList, setDeploymentsList] = useState<TasteTripDeployment[]>(initialDeployments);
  const [driversList, setDriversList] = useState<DeliveryDriver[]>(initialDrivers);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [buildSuccessMessage, setBuildSuccessMessage] = useState<string | null>(null);

  // New Driver Modal
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState<'MOTORBIKE' | 'SCOOTER' | 'BICYCLE'>('MOTORBIKE');
  const [newDriverPlate, setNewDriverPlate] = useState('');

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim() || !newDriverPhone.trim()) return;

    const created: DeliveryDriver = {
      id: `drv-${Date.now()}`,
      name: newDriverName.trim(),
      phone: newDriverPhone.trim(),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      vehicleType: newDriverVehicle,
      vehiclePlate: newDriverPlate.trim() || 'WP BZ-9000',
      status: 'AVAILABLE',
      rating: 5.0,
      completedDeliveries: 0,
      currentLat: 6.9271,
      currentLng: 79.8612,
      earningsToday: 0,
      verified: true,
    };

    setDriversList([created, ...driversList]);
    setIsAddDriverModalOpen(false);
    setNewDriverName('');
    setNewDriverPhone('');
    setNewDriverPlate('');
  };

  const handleTriggerEasBuild = (depId: string) => {
    setBuildingId(depId);
    setBuildSuccessMessage(null);
    setTimeout(() => {
      setDeploymentsList(prev => prev.map(d => {
        if (d.id === depId) {
          return {
            ...d,
            status: 'LIVE_STORES',
            version: `${d.version.replace('-rc.1', '')}.1`,
            lastBuildDate: 'Just now',
          };
        }
        return d;
      }));
      setBuildingId(null);
      setBuildSuccessMessage('Expo Application Services (EAS) build completed! Stores live with zero-downtime OTA.');
      setTimeout(() => setBuildSuccessMessage(null), 4000);
    }, 2500);
  };

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleDriverStatus = (drvId: string) => {
    setDriversList(prev => prev.map(d => {
      if (d.id === drvId) {
        const nextStatus = d.status === 'AVAILABLE' ? 'ON_DELIVERY' : d.status === 'ON_DELIVERY' ? 'OFFLINE' : 'AVAILABLE';
        return { ...d, status: nextStatus };
      }
      return d;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* 1. Main Digital Race Breadcrumb & Solutions Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Digital Race Platform
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-400">Business Solutions Suite</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold text-rose-400 flex items-center gap-1">
              <Bike className="w-3.5 h-3.5" />
              TasTrip Mobile & Fleet Ecosystem
            </span>
          </div>

          {onBackToDigitalRace && (
            <button
              onClick={onBackToDigitalRace}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              <span>← Back to Restaurant Management</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TasTrip Header & Solution Scope */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border-b border-slate-800 px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Digital Race SaaS • Solution Module</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 flex items-center gap-3">
              <span>TasTrip Dashboard</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-rose-600 text-white font-bold">
                Mobile & Fleet Console
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              The end-to-end mobile food ordering and delivery ecosystem for Pro restaurants in Digital Race. Includes dedicated customer mobile ordering, live rider radar dispatch, and centralized fleet management.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'OVERVIEW'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('CUSTOMER_APP')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'CUSTOMER_APP'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer App</span>
            </button>

            <button
              onClick={() => setActiveTab('DRIVER_COCKPIT')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'DRIVER_COCKPIT'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Driver Radar</span>
              {driverRadarOrder && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('FLEET_ROSTER')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'FLEET_ROSTER'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Fleet Network ({driversList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('EAS_BUILDS')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'EAS_BUILDS'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>EAS Builds ({deploymentsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('TECH_CODE')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'TECH_CODE'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Boilerplate Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & PERFORMANCE METRICS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-8">
          {/* Solution Highlight Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase">
                  Digital Race Solution Suite
                </span>
                <h2 className="text-xl font-bold text-white">
                  TasTrip: The Dedicated Mobile Engine of Digital Race
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  While Digital Race provides the core multi-tenant web platform, digital QR menus, and restaurant POS management, <strong>TasTrip</strong> handles the consumer-facing native mobile apps (iOS & Android) and high-precision courier delivery network in Colombo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  onClick={() => setActiveTab('CUSTOMER_APP')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/60 flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Launch Customer App Simulator</span>
                </button>
                <button
                  onClick={() => setActiveTab('DRIVER_COCKPIT')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2"
                >
                  <Bike className="w-4 h-4 text-emerald-400" />
                  <span>Open Rider Radar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Total TasTrip GMV</span>
              <p className="text-2xl font-black text-white font-mono mt-1">Rs. 4.82M</p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+24% Mobile Ordering Growth</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Active Mobile Installs</span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {deploymentsList.reduce((acc, d) => acc + d.activeInstalls, 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-cyan-400 mt-2 block font-medium">
                iOS App Store & Google Play
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Colombo Rider Fleet</span>
              <p className="text-2xl font-black text-white font-mono mt-1">{driversList.length} Couriers</p>
              <span className="text-[11px] text-emerald-400 mt-2 block font-medium">
                {driversList.filter(d => d.status !== 'OFFLINE').length} Online Right Now
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Avg Delivery Speed</span>
              <p className="text-2xl font-black text-white font-mono mt-1">23.8 Mins</p>
              <span className="text-[11px] text-slate-400 mt-2 block font-medium">
                Colombo 01-15 Metro Radius
              </span>
            </div>
          </div>

          {/* Solution Architecture Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">1. White-Label Client Apps</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every Pro restaurant gets their own custom-branded TasTrip app with their logo, theme palette, and menu catalog. Direct push notifications keep customers ordering repeatedly.
              </p>
              <button
                onClick={() => setActiveTab('CUSTOMER_APP')}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 pt-2"
              >
                <span>View Simulator</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                <Bike className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">2. Driver Radar Cockpit</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated interface for motorcycle and bicycle couriers with 30-second audio dispatch alerts, live turn-by-turn routing, customer calling, and instant digital payouts.
              </p>
              <button
                onClick={() => setActiveTab('DRIVER_COCKPIT')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-2"
              >
                <span>Test Live Cockpit</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">3. Digital Race Integration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Orders placed in TasTrip stream straight into the restaurant's Digital Race Kitchen KOT display and master sales ledger. Super Admins manage everything in one place.
              </p>
              <button
                onClick={() => setActiveTab('EAS_BUILDS')}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-2"
              >
                <span>Manage EAS Pipeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TASTRIP CUSTOMER APP SIMULATOR                                     */}
      {/* ========================================================================= */}
      {activeTab === 'CUSTOMER_APP' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase">Customer App Solution</span>
                <h2 className="text-xl font-bold text-white mt-1">TasTrip Mobile Experience</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  White-labeled food ordering interface built for Pro restaurants under the Digital Race umbrella. Customers browse the visual menu, toggle between <strong>Delivery</strong> and <strong>Pickup</strong>, make card payments, and track the courier live.
                </p>

                {/* Restaurant Brand Switcher */}
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-2">Simulate Restaurant Brand</label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => {
                      setSelectedTenantId(e.target.value);
                      if (onSelectTenant) onSelectTenant(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} [{t.tier || 'PRO'}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Order Method:</span>
                    <span className="font-bold text-rose-400">{orderType}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Payment Processor:</span>
                    <span className="font-semibold text-emerald-400">Stripe Mobile PaymentSheet</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">GPS Telemetry:</span>
                    <span className="font-semibold text-cyan-400">Real-Time WebSocket Stream</span>
                  </div>
                </div>
              </div>

              {/* Active Tracker if simulated order placed */}
              {clientActiveOrder && (
                <div className="bg-slate-900 border border-rose-900/50 rounded-2xl p-6 shadow-xl shadow-rose-950/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-rose-400">{clientActiveOrder.id}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      {clientActiveOrder.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2">TasTrip Real-Time Tracker</h3>
                  <div className="w-full bg-slate-950 rounded-full h-2 mb-4 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-rose-500 h-full transition-all duration-700" 
                      style={{ 
                        width: clientActiveOrder.status === 'PLACED' ? '25%' :
                               clientActiveOrder.status === 'PREPARING' ? '50%' :
                               clientActiveOrder.status === 'PICKED_UP' ? '75%' : '100%' 
                      }} 
                    />
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Estimated Arrival:</span>
                      <span className="font-mono font-bold text-white">
                        {clientActiveOrder.etaMinutes > 0 ? `${clientActiveOrder.etaMinutes} mins` : 'Delivered!'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">TasTrip Courier:</span>
                      <span className="font-semibold text-white">{clientActiveOrder.driverName}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setClientActiveOrder(null)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Reset Order Demo
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Phone Simulator Frame */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-[390px] bg-slate-950 border-4 border-slate-800 rounded-[44px] shadow-2xl overflow-hidden flex flex-col h-[740px] relative">
                {/* Phone Speaker Notch */}
                <div className="bg-slate-950 pt-3 pb-2 px-6 flex justify-between items-center z-20 border-b border-slate-900">
                  <span className="text-[11px] font-bold text-slate-300">9:41</span>
                  <div className="w-24 h-4 bg-slate-900 rounded-full" />
                  <span className="text-[10px] text-slate-400">5G ●●●</span>
                </div>

                {/* App Brand Header */}
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">TasTrip</span>
                    <h3 className="text-sm font-bold text-white truncate">{activeTenant.name}</h3>
                  </div>

                  {/* Delivery / Pickup Pill */}
                  <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setOrderType('DELIVERY')}
                      className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                        orderType === 'DELIVERY' ? 'bg-rose-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      <Bike className="w-3 h-3" />
                      <span>Delivery</span>
                    </button>
                    <button
                      onClick={() => setOrderType('PICKUP')}
                      className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                        orderType === 'PICKUP' ? 'bg-rose-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      <Store className="w-3 h-3" />
                      <span>Pickup</span>
                    </button>
                  </div>
                </div>

                {/* Mobile App Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Hero Cover Banner */}
                  <div className="relative rounded-2xl overflow-hidden h-28 border border-slate-800">
                    <img 
                      src={activeTenant.coverImageUrl} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs">
                      <span className="text-white font-bold truncate">30-40 min • Colombo Metro</span>
                      <span className="bg-rose-600/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ★ 4.9 (420+)
                      </span>
                    </div>
                  </div>

                  {/* Categories Row */}
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {activeTenant.categories.map((cat, idx) => (
                      <span
                        key={cat.id}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer border ${
                          idx === 0 
                            ? 'bg-rose-600 text-white border-rose-500' 
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>

                  {/* Menu Items List */}
                  <div className="space-y-3">
                    {activeTenant.products.slice(0, 5).map(prod => {
                      const inCart = clientCart[prod.id] || 0;
                      return (
                        <div 
                          key={prod.id} 
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex gap-3 items-center hover:border-slate-700 transition-all"
                        >
                          <img 
                            src={prod.imageUrl} 
                            alt={prod.name} 
                            className="w-18 h-18 rounded-xl object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{prod.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-mono font-bold text-rose-400">
                                {activeTenant.currency} {prod.price.toLocaleString()}
                              </span>

                              {inCart === 0 ? (
                                <button
                                  onClick={() => addToCart(prod.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 shadow"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                                  <button onClick={() => removeFromCart(prod.id)} className="text-slate-400 hover:text-white">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-bold text-white">{inCart}</span>
                                  <button onClick={() => addToCart(prod.id)} className="text-rose-400 hover:text-white">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Floating Cart Bar */}
                {cartTotal > 0 && (
                  <div className="bg-slate-900 border-t border-slate-800 p-3 flex items-center justify-between shrink-0 shadow-2xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {Object.values(clientCart).reduce((a, b) => a + b, 0)} Items
                      </span>
                      <span className="text-sm font-black text-white font-mono">
                        {activeTenant.currency} {grandTotal.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsClientCheckoutOpen(true)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/50"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Review & Pay</span>
                    </button>
                  </div>
                )}

                {/* Checkout Modal Sheet */}
                {isClientCheckoutOpen && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col justify-end">
                    <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-rose-500" />
                          <span>TasTrip Checkout</span>
                        </h4>
                        <button 
                          onClick={() => setIsClientCheckoutOpen(false)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span>Items Subtotal:</span>
                          <span className="font-mono text-white">Rs. {cartTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                          <span>Delivery Courier:</span>
                          <span className="font-mono text-white">Rs. {deliveryFee}</span>
                        </div>
                        <div className="flex items-center justify-between text-white font-bold border-t border-slate-800 pt-2">
                          <span>Total to Pay:</span>
                          <span className="font-mono text-rose-400 text-sm">Rs. {grandTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700 flex items-center justify-center font-bold text-[10px] text-indigo-300">
                          VISA
                        </div>
                        <div className="text-xs">
                          <p className="font-semibold text-white">Visa ending in 4242</p>
                          <p className="text-[10px] text-slate-400">PCI-Compliant Stripe Mobile Sheet</p>
                        </div>
                      </div>

                      <button
                        onClick={handleClientPlaceOrder}
                        className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Charge Card</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TASTRIP DRIVER RADAR & LIVE COCKPIT                                */}
      {/* ========================================================================= */}
      {activeTab === 'DRIVER_COCKPIT' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">Courier Logistics</span>
                <h2 className="text-xl font-bold text-white mt-1">TasTrip Driver Cockpit</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Dedicated interface for motorcycle and scooter delivery riders in the TasTrip fleet. Features live GPS map tracking, audio dispatch radar alerts, order acceptance, and turn-by-turn navigation.
                </p>

                {/* Driver Profile */}
                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" 
                      alt="Driver" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">Suresh Jayawardena</h4>
                      <p className="text-xs text-slate-400">Motorbike (WP BCD-4421)</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-amber-400">★ 4.9 Rating</span>
                        <span className="text-[10px] text-slate-500">• 428 Deliveries</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Today's Pay</span>
                    <span className="text-base font-black text-emerald-400 font-mono">Rs. 6,850</span>
                  </div>
                </div>

                {/* Duty Switch */}
                <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Duty Availability</span>
                    <span className="text-[11px] text-slate-400">
                      {driverOnline ? 'Receiving real-time dispatch offers' : 'Offline • No orders dispatched'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setDriverOnline(!driverOnline);
                      if (driverOnline) setDriverRadarOrder(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      driverOnline ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {driverOnline ? 'ONLINE' : 'OFFLINE'}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <Compass className="w-4 h-4" />
                  <span>Dispatch Radar Simulation</span>
                </div>
                <p>
                  Keep the driver <strong>Online</strong> to receive simulated orders from nearby Pro restaurants within 3-4 seconds!
                </p>
              </div>
            </div>

            {/* Right Column: Phone Screen */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-[390px] bg-slate-950 border-4 border-slate-800 rounded-[44px] shadow-2xl overflow-hidden flex flex-col h-[740px] relative">
                {/* GPS Map Canvas */}
                <div className="relative flex-1 bg-slate-900 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                  {/* SVG Map Lines */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 50 100 Q 150 200 340 180" stroke="#334155" strokeWidth="6" fill="none" />
                    <path d="M 80 400 L 250 220 L 320 500" stroke="#334155" strokeWidth="6" fill="none" />
                    <path d="M 190 50 L 190 650" stroke="#1e293b" strokeWidth="8" fill="none" />

                    {driverActiveTrip && (
                      <path 
                        d="M 120 480 Q 200 320 280 200" 
                        stroke="#e11d48" 
                        strokeWidth="5" 
                        strokeDasharray="6,4"
                        fill="none" 
                        className="animate-pulse"
                      />
                    )}
                  </svg>

                  {/* Restaurant Marker */}
                  <div className="absolute top-[180px] right-[80px] flex flex-col items-center">
                    <span className="text-[10px] font-bold bg-slate-950 px-2 py-0.5 rounded border border-rose-600 text-white shadow mb-1">
                      {activeTenant.name}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white text-xs shadow-lg shadow-rose-950/60">
                      🍽️
                    </div>
                  </div>

                  {/* Customer Marker */}
                  <div className="absolute bottom-[220px] left-[90px] flex flex-col items-center">
                    <span className="text-[10px] font-bold bg-slate-950 px-2 py-0.5 rounded border border-emerald-500 text-white shadow mb-1">
                      Kasun R. (Dropoff)
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs shadow-lg shadow-emerald-950/60">
                      🏠
                    </div>
                  </div>

                  {/* Bike Courier Marker */}
                  <div 
                    className="absolute transition-all duration-700 flex flex-col items-center"
                    style={{
                      top: driverActiveTrip?.step === 'AT_RESTAURANT' ? '220px' : '360px',
                      left: driverActiveTrip?.step === 'AT_RESTAURANT' ? '240px' : '170px',
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-xl animate-bounce">
                      🛵
                    </div>
                    <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded mt-0.5 font-mono">
                      YOU (TasTrip)
                    </span>
                  </div>

                  {/* Header Bar */}
                  <div className="absolute top-12 left-4 right-4 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${driverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      <span className="text-xs font-bold text-white">
                        {driverOnline ? 'TasTrip Dispatch Active' : 'Rider Offline'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">Rs. 6,850 Today</span>
                  </div>

                  {/* Active Order Card */}
                  {driverActiveTrip && (
                    <div className="absolute bottom-6 left-4 right-4 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-3xl p-4 shadow-2xl z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-rose-400">TasTrip {driverActiveTrip.orderNum}</span>
                          <h4 className="text-xs font-bold text-white">{driverActiveTrip.restaurant}</h4>
                        </div>
                        <a
                          href={`tel:${driverActiveTrip.phone}`}
                          className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{driverActiveTrip.address}</span>
                      </div>

                      {/* Step buttons */}
                      {driverActiveTrip.step === 'AT_RESTAURANT' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => window.open(`https://maps.google.com`, '_blank')}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Google Maps</span>
                          </button>
                          <button
                            onClick={() => setDriverActiveTrip({ ...driverActiveTrip, step: 'PICKED_UP' })}
                            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                          >
                            Confirm Picked Up
                          </button>
                        </div>
                      )}

                      {driverActiveTrip.step === 'PICKED_UP' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => window.open(`https://maps.google.com`, '_blank')}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Navigate Customer</span>
                          </button>
                          <button
                            onClick={() => {
                              alert(`Delivery Complete! Earnings of Rs. ${driverActiveTrip.earnings} credited to your TasTrip wallet.`);
                              setDriverActiveTrip(null);
                            }}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                          >
                            Complete Delivery
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Incoming Radar Modal */}
                  {driverRadarOrder && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col justify-end p-4">
                      <div className="bg-slate-900 border border-rose-600/80 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-rose-500 tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span>NEW TASTRIP OFFER</span>
                          </span>
                          <span className="text-xs font-mono font-bold bg-rose-950 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-800">
                            {radarCountdown}s
                          </span>
                        </div>

                        <div>
                          <span className="text-2xl font-black text-white font-mono">
                            Rs. {driverRadarOrder.earnings}
                          </span>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {driverRadarOrder.distanceKm} km total trip • Instant payout
                          </p>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                          <p className="text-slate-300"><strong>Pickup:</strong> {driverRadarOrder.restaurant}</p>
                          <p className="text-slate-300 truncate"><strong>Dropoff:</strong> {driverRadarOrder.address}</p>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setDriverRadarOrder(null)}
                            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                          >
                            Decline
                          </button>
                          <button
                            onClick={handleDriverAccept}
                            className="flex-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/60"
                          >
                            ACCEPT DELIVERY
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FLEET ROSTER & RIDER NETWORK                                       */}
      {/* ========================================================================= */}
      {activeTab === 'FLEET_ROSTER' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">TasTrip Logistics</span>
              <h2 className="text-xl font-bold text-white mt-1">Central Delivery Driver Fleet</h2>
              <p className="text-xs text-slate-400 mt-1">
                Verified couriers servicing all Pro restaurants in the Digital Race ecosystem across Colombo.
              </p>
            </div>

            <button
              onClick={() => setIsAddDriverModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Driver</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {driversList.map(drv => (
              <div key={drv.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <img src={drv.avatarUrl} alt={drv.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-700" />
                    <button
                      onClick={() => toggleDriverStatus(drv.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-all ${
                        drv.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900' :
                        drv.status === 'ON_DELIVERY' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900' :
                        'bg-slate-950 text-slate-500 hover:bg-slate-800'
                      }`}
                      title="Click to toggle driver status"
                    >
                      {drv.status.replace('_', ' ')}
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white">{drv.name}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{drv.phone}</p>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium">{drv.vehicleType} • {drv.vehiclePlate}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-amber-400">★ {drv.rating}</span>
                    <span className="text-xs text-slate-500">• {drv.completedDeliveries} Trips</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Today's Earnings</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    Rs. {drv.earningsToday.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Driver Modal */}
          {isAddDriverModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-base font-bold text-white mb-1">Onboard New TasTrip Driver</h3>
                <p className="text-xs text-slate-400 mb-4">Register a delivery partner to join the central fleet.</p>

                <form onSubmit={handleCreateDriver} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      placeholder="e.g. Sanjeewa Perera"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number (WhatsApp)</label>
                    <input
                      type="text"
                      value={newDriverPhone}
                      onChange={(e) => setNewDriverPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Vehicle Type</label>
                      <select
                        value={newDriverVehicle}
                        onChange={(e) => setNewDriverVehicle(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="MOTORBIKE">Motorbike</option>
                        <option value="SCOOTER">Scooter</option>
                        <option value="BICYCLE">E-Bicycle</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Vehicle Plate</label>
                      <input
                        type="text"
                        value={newDriverPlate}
                        onChange={(e) => setNewDriverPlate(e.target.value)}
                        placeholder="WP BCD-1234"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddDriverModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50"
                    >
                      Save Driver
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: EAS BUILDS & APP STORE DISTRIBUTION                                */}
      {/* ========================================================================= */}
      {activeTab === 'EAS_BUILDS' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Expo Application Services</span>
            <h2 className="text-xl font-bold text-white mt-1">TasTrip App Store Deployments</h2>
            <p className="text-xs text-slate-400 mt-1">
              Custom iOS & Android packages generated for Pro tier restaurant subscribers in Digital Race.
            </p>
          </div>

          {buildSuccessMessage && (
            <div className="bg-emerald-950/80 border border-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{buildSuccessMessage}</span>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Restaurant Client</th>
                    <th className="pb-3 font-semibold">Bundle Identifier</th>
                    <th className="pb-3 font-semibold">Version</th>
                    <th className="pb-3 font-semibold">OTA Channel</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">EAS Build Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {deploymentsList.map(dep => (
                    <tr key={dep.id} className="hover:bg-slate-950/40">
                      <td className="py-4 font-bold text-white flex items-center gap-2.5">
                        <img src={dep.appIconUrl} alt="Icon" className="w-8 h-8 rounded-xl object-cover" />
                        <span>{dep.restaurantName}</span>
                      </td>
                      <td className="py-4 font-mono text-slate-400">{dep.bundleId}</td>
                      <td className="py-4 text-slate-300 font-mono">{dep.version}</td>
                      <td className="py-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {dep.otaChannel}
                        </span>
                      </td>
                      <td className="py-4">
                        {dep.status === 'LIVE_STORES' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            LIVE IN STORES
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                            BUILD QUEUED
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleTriggerEasBuild(dep.id)}
                          disabled={buildingId === dep.id}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-bold text-[11px] shadow transition-all flex items-center gap-1.5 ml-auto"
                        >
                          {buildingId === dep.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Building...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Trigger OTA Build</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SOURCE CODE & BOILERPLATES                                         */}
      {/* ========================================================================= */}
      {activeTab === 'TECH_CODE' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8 space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-rose-500" />
              <span>TasTrip Source Code & Boilerplates</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Production-ready TypeScript implementations for the Expo Universal App, Driver Dashboard, and Next.js Master Panel API routes.
            </p>
          </div>

          {/* Architecture Guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-bold">1. Technical Stack & Monorepo Strategy</span>
              <button
                onClick={() => copyCode(MOBILE_APP_ARCHITECTURE_GUIDE, 'ARCH')}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                {copiedKey === 'ARCH' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'ARCH' ? 'Copied' : 'Copy Guide'}</span>
              </button>
            </div>
            <pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
              {MOBILE_APP_ARCHITECTURE_GUIDE}
            </pre>
          </div>

          {/* Driver Boilerplate */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-bold">2. Driver Dashboard (React Native / Expo Maps)</span>
              <button
                onClick={() => copyCode(DRIVER_UI_REACT_NATIVE_BOILERPLATE, 'DRIVER')}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                {copiedKey === 'DRIVER' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'DRIVER' ? 'Copied' : 'Copy Driver Code'}</span>
              </button>
            </div>
            <pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
              {DRIVER_UI_REACT_NATIVE_BOILERPLATE}
            </pre>
          </div>

          {/* Client Boilerplate */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-bold">3. Customer Food Ordering & Checkout (React Native)</span>
              <button
                onClick={() => copyCode(CLIENT_UI_REACT_NATIVE_BOILERPLATE, 'CLIENT')}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                {copiedKey === 'CLIENT' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'CLIENT' ? 'Copied' : 'Copy Client Code'}</span>
              </button>
            </div>
            <pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
              {CLIENT_UI_REACT_NATIVE_BOILERPLATE}
            </pre>
          </div>

          {/* Next.js Master Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-bold">4. Digital Race Master Agency Panel (Next.js 15)</span>
              <button
                onClick={() => copyCode(NEXTJS_CEYTEQ_MASTER_PANEL_BOILERPLATE, 'MASTER')}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                {copiedKey === 'MASTER' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'MASTER' ? 'Copied' : 'Copy Next.js Code'}</span>
              </button>
            </div>
            <pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
              {NEXTJS_CEYTEQ_MASTER_PANEL_BOILERPLATE}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
