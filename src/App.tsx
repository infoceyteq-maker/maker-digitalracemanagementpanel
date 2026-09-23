import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerUI } from './components/CustomerUI';
import { ProPosKot } from './components/ProPosKot';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ArchitectureHub } from './components/ArchitectureHub';
import { TasteTripEcosystem } from './components/TasteTripEcosystem';
import { SilkWaveBackdrop } from './components/SilkWaveBackdrop';
import { SecurityCenter } from './components/SecurityCenter';
import { SecurityAuthModal } from './components/SecurityAuthModal';
import { PortalLauncherModal } from './components/PortalLauncherModal';
import { RbacBarrier } from './components/RbacBarrier';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { AccountActivationView } from './components/AccountActivationView';
import { LoginGate } from './components/LoginGate';
import { INITIAL_TENANTS, INITIAL_ORDERS, INITIAL_DRIVERS, INITIAL_DEPLOYMENTS, generateTenantDailyTrends } from './mockData';
import { ActiveView, Tenant, TenantStatus, WaiterRequest, CustomerOrder, DeliveryDriver, TasteTripDeployment, AuthUser } from './types';
import { soundService } from './lib/audioService';
import { 
  subscribeToDigitalRaceRealtime, 
  broadcastOrder, 
  broadcastOrderStatus, 
  broadcastWaiterCall, 
  broadcastDismissWaiterCall, 
  broadcastTenantUpdate 
} from './lib/supabaseClient';
import { credentialsService } from './lib/credentialsService';
import { Tv, Radio, ArrowLeftRight } from 'lucide-react';

const SAVED_TENANTS_KEY = 'ceyteq_tenants_v3';
const SAVED_ORDERS_KEY = 'ceyteq_orders_v3';

export default function App() {
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_TENANTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load tenants from storage', e);
    }
    return INITIAL_TENANTS;
  });

  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SAVED_TENANTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch (e) {}
    return INITIAL_TENANTS[0].id;
  });

  const [activeView, setActiveView] = useState<ActiveView>('PUBLIC_MENU');
  const [tableNumber, setTableNumber] = useState<number>(4);

  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_ORDERS_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load orders from storage', e);
    }
    return INITIAL_ORDERS;
  });

  const [drivers, setDrivers] = useState<DeliveryDriver[]>(INITIAL_DRIVERS);
  const [deployments, setDeployments] = useState<TasteTripDeployment[]>(INITIAL_DEPLOYMENTS);

  // Standalone device mode (e.g. tablet on kitchen or table without top navigation bar)
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isPortalLauncherOpen, setIsPortalLauncherOpen] = useState<boolean>(false);
  const [isActivationMode, setIsActivationMode] = useState<boolean>(false);

  // Authentication & Security User State (Loaded from persistent session or null for unauthenticated visitors)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return credentialsService.getCurrentSessionUser();
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLoginGateOpen, setIsLoginGateOpen] = useState<boolean>(false);

  // Real-time table calls state
  const [waiterCalls, setWaiterCalls] = useState<WaiterRequest[]>([
    {
      id: 'call-1',
      tableNumber: 4,
      type: 'CALL_WAITER',
      status: 'PENDING',
      timestamp: '2 mins ago',
    },
    {
      id: 'call-2',
      tableNumber: 8,
      type: 'WATER_REFILL',
      status: 'PENDING',
      timestamp: '7 mins ago',
    },
  ]);

  // Parse URL search parameters on initial mount (for dedicated portal links / QR codes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const portal = params.get('portal');
    const table = params.get('table');
    const tenantParam = params.get('t');
    const standaloneParam = params.get('standalone');

    if (portal === 'menu' || portal === 'customer') {
      setActiveView('PUBLIC_MENU');
      if (standaloneParam !== 'false') setIsStandalone(true);
    } else if (portal === 'restaurant' || portal === 'admin') {
      setActiveView('CLIENT_DASHBOARD');
      if (standaloneParam === 'true') setIsStandalone(true);
    } else if (portal === 'pos' || portal === 'kitchen' || portal === 'kot') {
      setActiveView('PRO_OPERATIONS');
      if (standaloneParam !== 'false') setIsStandalone(true);
    } else if (portal === 'master' || portal === 'super' || portal === 'digitalrace' || portal === 'tastetrip' || portal === 'division') {
      setActiveView('SUPER_ADMIN');
      if (standaloneParam === 'true') setIsStandalone(true);
    }

    const pathname = window.location.pathname;
    if (
      pathname.includes('/auth/activate') ||
      portal === 'activate' ||
      (params.get('token') && (params.get('email') || pathname.includes('activate')))
    ) {
      setIsActivationMode(true);
    }

    if (params.get('login') === 'true') {
      if (!credentialsService.getCurrentSessionUser()) {
        setIsLoginGateOpen(true);
      } else {
        setIsAuthModalOpen(true);
      }
    }

    if (table) {
      const parsedTable = parseInt(table, 10);
      if (!isNaN(parsedTable)) {
        setTableNumber(parsedTable);
      }
    }

    if (tenantParam) {
      setTenants(currentTenants => {
        const found = currentTenants.find(t => t.slug === tenantParam || t.id === tenantParam);
        if (found) {
          setCurrentTenantId(found.id);
        }
        return currentTenants;
      });
    }
  }, []);

  // Supabase Real-Time Broadcast & Event Subscription
  useEffect(() => {
    const unsubscribe = subscribeToDigitalRaceRealtime(currentTenantId, {
      onNewOrder: (incomingOrder) => {
        setOrders(prev => {
          if (prev.some(o => o.id === incomingOrder.id)) return prev;
          soundService.playOrderBell();
          return [incomingOrder, ...prev];
        });
        setTenants(prev => prev.map(t => 
          t.id === incomingOrder.tenantId ? { ...t, totalOrders: t.totalOrders + 1 } : t
        ));
      },
      onOrderStatusUpdate: (orderId, newStatus) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (newStatus === 'READY' || newStatus === 'COMPLETED') {
          soundService.playSuccessChime();
        }
      },
      onNewWaiterCall: (incomingCall) => {
        setWaiterCalls(prev => {
          if (prev.some(c => c.id === incomingCall.id)) return prev;
          soundService.playWaiterCallChime();
          return [incomingCall, ...prev];
        });
      },
      onDismissWaiterCall: (callId) => {
        setWaiterCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'ATTENDED' } : c));
      },
      onTenantUpdate: (updatedTenant) => {
        setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentTenantId]);

  const currentTenant = tenants.find(t => t.id === currentTenantId) || tenants[0];

  // RBAC checks
  const canAccessProOperations = 
    currentUser?.role === 'SUPER_ADMIN' || 
    currentUser?.role === 'SUPER_MASTER_ADMIN' ||
    currentUser?.role === 'DIGITAL_RACE_MASTER' ||
    currentUser?.tier === 'PRO' || 
    currentTenant.tier === 'PRO';

  const canAccessSuperAdmin = 
    currentUser?.role === 'SUPER_ADMIN' || 
    currentUser?.role === 'SUPER_MASTER_ADMIN' || 
    currentUser?.role === 'DIGITAL_RACE_MASTER' ||
    currentUser?.role === 'TASTETRIP_MASTER';

  // Update tenant details (food prices, stock status, custom domain)
  const handleUpdateTenant = (updatedTenant: Tenant) => {
    setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
    broadcastTenantUpdate(updatedTenant);
  };

  // Update status (e.g. Super admin disables or enables access)
  const handleUpdateTenantStatus = (tenantId: string, status: TenantStatus) => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status } : t));
  };

  // Clear all demo orders for a 100% clean live restaurant operation
  const handleClearDemoOrders = () => {
    setOrders([]);
    setWaiterCalls([]);
    localStorage.setItem(SAVED_ORDERS_KEY, JSON.stringify([]));
  };

  // Reset demo data or reset to a completely clean blank slate
  const handleResetAllDemoData = (cleanStarterRestaurant: boolean = false) => {
    if (cleanStarterRestaurant) {
      const cleanStarter: Tenant = {
        id: 'tenant-real-1',
        name: 'My Real Restaurant',
        slug: 'my-restaurant',
        ownerName: 'Restaurant Owner',
        ownerEmail: 'owner@myrestaurant.com',
        ownerPassword: 'owner@pass2026',
        kitchenPin: '2026',
        waiterPin: '1122',
        status: 'ACTIVE',
        plan: 'PRO',
        monthlyFee: 129,
        createdAt: new Date().toISOString().split('T')[0],
        subdomain: 'my-restaurant',
        customDomainVerified: false,
        dnsStatus: 'NOT_CONFIGURED',
        dnsExpectedCname: 'cname.ceyteq.com',
        logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
        coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
        accentColor: '#e11d48',
        phone: '+94 77 000 0000',
        address: 'Colombo, Sri Lanka',
        currency: 'LKR',
        tableCount: 15,
        totalViews: 0,
        totalOrders: 0,
        tier: 'PRO',
        palette: 'PALETTE_1',
        deliveryEnabled: true,
        paymentGatewayEnabled: true,
        whatsappMessagingEnabled: true,
        categories: [
          { id: 'cat-starter-1', name: 'Main Dishes', nameSi: 'ප්‍රධාන ආහාර', iconName: 'Utensils', order: 1 }
        ],
        products: [],
        socialLinks: {
          facebook: 'https://facebook.com',
          instagram: 'https://instagram.com',
          tiktok: '',
          whatsapp: '+94770000000',
          showFacebook: true,
          showInstagram: true,
          showTiktok: false,
          showYoutube: false,
          showWhatsapp: true,
        },
        dailyTrends: generateTenantDailyTrends(0, 0, 0),
      };
      setTenants([cleanStarter]);
      setCurrentTenantId(cleanStarter.id);
      localStorage.setItem(SAVED_TENANTS_KEY, JSON.stringify([cleanStarter]));
    } else {
      setTenants(INITIAL_TENANTS);
      setCurrentTenantId(INITIAL_TENANTS[0].id);
      localStorage.removeItem(SAVED_TENANTS_KEY);
    }
    setOrders([]);
    setWaiterCalls([]);
    localStorage.setItem(SAVED_ORDERS_KEY, JSON.stringify([]));
  };

  // Create new tenant from Super Admin with separate passwords and clean initial metrics
  const handleCreateTenant = (data: Partial<Tenant>) => {
    const newId = `tenant-${Date.now()}`;
    const ownerPassword = data.ownerPassword || `${data.slug || 'owner'}@2026`;
    const kitchenPin = data.kitchenPin || '2026';
    const waiterPin = data.waiterPin || '1122';

    const newTenant: Tenant = {
      id: newId,
      name: data.name || 'New Restaurant',
      slug: data.slug || 'new-restaurant',
      ownerName: data.ownerName || 'Restaurant Owner',
      ownerEmail: data.ownerEmail || 'owner@restaurant.com',
      ownerPassword,
      kitchenPin,
      waiterPin,
      status: 'ACTIVE',
      plan: data.plan || 'PRO',
      monthlyFee: data.monthlyFee || (data.plan === 'STARTER' ? 29 : data.plan === 'ENTERPRISE' ? 149 : 129),
      createdAt: new Date().toISOString().split('T')[0],
      subdomain: data.slug || 'new-restaurant',
      customDomain: data.customDomain,
      customDomainVerified: false,
      dnsStatus: data.customDomain ? 'PENDING' : 'NOT_CONFIGURED',
      dnsExpectedCname: 'cname.ceyteq.com',
      logoUrl: data.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
      coverImageUrl: data.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
      accentColor: data.accentColor || '#e11d48',
      phone: data.phone || '+94 77 123 4567',
      address: data.address || 'Colombo, Sri Lanka',
      currency: data.currency || 'LKR',
      tableCount: data.tableCount || 15,
      totalViews: 0,
      totalOrders: 0,
      tier: data.tier || 'PRO',
      palette: data.palette || 'PALETTE_1',
      socialLinks: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        tiktok: '',
        whatsapp: data.phone || '+94770000000',
        showFacebook: true,
        showInstagram: true,
        showTiktok: false,
        showYoutube: false,
        showWhatsapp: true,
      },
      deliveryEnabled: data.tier !== 'FREE',
      paymentGatewayEnabled: data.tier !== 'FREE',
      whatsappMessagingEnabled: data.tier !== 'FREE',
      hasAiChatbot: data.hasAiChatbot ?? true,
      dailyTrends: generateTenantDailyTrends(0, 0, 0),
      categories: data.categories || [
        { id: `cat-1-${newId}`, name: 'Signature Dishes', nameSi: 'විශේෂ ආහාර', iconName: 'Sparkles', order: 1 },
        { id: `cat-2-${newId}`, name: 'Beverages', nameSi: 'බීම වර්ග', iconName: 'Coffee', order: 2 },
      ],
      products: data.products !== undefined ? data.products : [
        {
          id: `prod-1-${newId}`,
          name: 'Signature Chef Special',
          nameSi: 'විශේෂ කෑම',
          description: 'Authentic chef selected recipe with fresh herbs and spices.',
          price: 2200,
          currency: data.currency || 'LKR',
          categoryId: `cat-1-${newId}`,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
          isAvailable: true,
          isHalal: true,
          preparationTime: '15 mins',
        }
      ]
    };

    // Persist separate role credentials
    credentialsService.setTenantPassword(
      newId,
      newTenant.ownerEmail,
      ownerPassword,
      kitchenPin,
      waiterPin
    );

    const updatedTenants = [newTenant, ...tenants];
    setTenants(updatedTenants);
    localStorage.setItem(SAVED_TENANTS_KEY, JSON.stringify(updatedTenants));
    setCurrentTenantId(newId);
    broadcastTenantUpdate(newTenant);
  };

  // Call waiter from customer view
  const handleCallWaiter = (table: number, type: string) => {
    const newCall: WaiterRequest = {
      id: `call-${Date.now()}`,
      tableNumber: table,
      type: type as any,
      status: 'PENDING',
      timestamp: 'Just now',
    };
    setWaiterCalls(prev => [newCall, ...prev]);
    broadcastWaiterCall(newCall);
    soundService.playWaiterCallChime();
  };

  // Dismiss waiter call from dashboard
  const handleDismissWaiterCall = (callId: string) => {
    setWaiterCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'ATTENDED' } : c));
    broadcastDismissWaiterCall(callId);
  };

  // Place order from Customer UI
  const handlePlaceOrder = (newOrder: CustomerOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    setTenants(prev => prev.map(t => 
      t.id === newOrder.tenantId ? { ...t, totalOrders: t.totalOrders + 1 } : t
    ));
    broadcastOrder(newOrder);
    soundService.playOrderBell();
  };

  // Update order status from KOT / Kitchen
  const handleUpdateOrderStatus = (orderId: string, status: CustomerOrder['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    broadcastOrderStatus(orderId, status);
    if (status === 'READY' || status === 'COMPLETED') {
      soundService.playSuccessChime();
    }
  };

  // Add order from Walk-in POS
  const handleAddNewOrder = (newOrder: CustomerOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    setTenants(prev => prev.map(t => 
      t.id === newOrder.tenantId ? { ...t, totalOrders: t.totalOrders + 1 } : t
    ));
    broadcastOrder(newOrder);
    soundService.playOrderBell();
  };

  if (isActivationMode) {
    return (
      <AccountActivationView
        onSuccessRedirect={(targetUrl, userMeta) => {
          setIsActivationMode(false);
          if (userMeta) {
            setCurrentUser({
              id: userMeta.id || 'usr-activated',
              email: userMeta.email,
              name: userMeta.name,
              role: userMeta.role === 'DIVISION_ADMIN' ? ('DIVISION_ADMIN' as any) : 'SUPER_ADMIN',
              tier: 'PRO',
              isEmailVerified: true,
              mfaEnabled: false,
              status: 'ACTIVE',
              failedLoginAttempts: 0,
            });
          }
          if (targetUrl.includes('tastetrip')) {
            setActiveView('TASTE_TRIP');
          } else if (targetUrl.includes('restaurant')) {
            setActiveView('CLIENT_DASHBOARD');
          } else {
            setActiveView('SUPER_ADMIN');
          }
        }}
        onRequestDualOtp={(email) => {
          setIsActivationMode(false);
          setIsAuthModalOpen(true);
        }}
      />
    );
  }

  // Strict Enterprise Login Barrier:
  // If user is unauthenticated and attempting to access any protected view (Admin/Master/Kitchen/etc)
  // or if login gate is explicitly requested, render LoginGate full-screen with no bypass!
  const isProtectedView = activeView !== 'PUBLIC_MENU';
  if ((!currentUser && isProtectedView) || (!currentUser && isLoginGateOpen)) {
    return (
      <LoginGate
        portalTarget={activeView}
        onLoginSuccess={(user, _token, redirectUrl) => {
          setCurrentUser(user);
          credentialsService.setCurrentSessionUser(user);
          setIsLoginGateOpen(false);
          setIsAuthModalOpen(false);
          if (redirectUrl) {
            if (
              redirectUrl.includes('/dashboard/super') ||
              redirectUrl.includes('division') ||
              redirectUrl.includes('digital-race') ||
              redirectUrl.includes('tastetrip')
            ) {
              setActiveView('SUPER_ADMIN');
            } else if (redirectUrl.includes('restaurant')) {
              setActiveView('CLIENT_DASHBOARD');
            }
          }
        }}
        onOpenDualOtpReset={() => {
          setIsLoginGateOpen(false);
          setIsAuthModalOpen(true);
        }}
        onGoToPublicMenu={() => {
          setIsLoginGateOpen(false);
          setActiveView('PUBLIC_MENU');
        }}
      />
    );
  }

  return (
    <GlobalErrorBoundary>
      <div className="min-h-screen bg-silk-light-gradient text-slate-900 flex flex-col font-sans relative">
        {/* Background silk wave drape */}
        <SilkWaveBackdrop />

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Show top Navigation Bar when NOT in standalone dedicated mode */}
          {!isStandalone ? (
            <Navbar
              activeView={activeView}
              setActiveView={setActiveView}
              tenants={tenants}
              currentTenantId={currentTenantId}
              onSelectTenant={setCurrentTenantId}
              waiterCalls={waiterCalls}
              tableNumber={tableNumber}
              setTableNumber={setTableNumber}
              currentUser={currentUser}
              onOpenAuthModal={() => {
                if (!currentUser) {
                  setIsLoginGateOpen(true);
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              onOpenPortalLauncher={() => setIsPortalLauncherOpen(true)}
            />
          ) : (
            /* Standalone Device floating action bar */
            <div className="fixed bottom-3 right-3 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg border border-sky-500/40 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-slate-200 hidden sm:inline">
                {activeView === 'PUBLIC_MENU' ? `Customer Menu (#${tableNumber})` : 
                 activeView === 'PRO_OPERATIONS' ? 'Kitchen KOT & POS' : 
                 activeView === 'CLIENT_DASHBOARD' ? 'Restaurant Admin' : 'Master Admin'}
              </span>
              <button
                onClick={() => setIsPortalLauncherOpen(true)}
                className="p-1 hover:text-[#00C8FF] transition-colors"
                title="Open Portal Switcher"
              >
                <Tv className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsStandalone(false)}
                className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-full font-bold text-[10px] text-slate-300 transition-colors"
              >
                Exit Standalone
              </button>
            </div>
          )}

          <main className="flex-1 pb-16 md:pb-0">
            {activeView === 'PUBLIC_MENU' && (
              <CustomerUI
                tenant={currentTenant}
                tableNumber={tableNumber}
                onCallWaiter={handleCallWaiter}
                onPlaceOrder={handlePlaceOrder}
                onOpenDashboard={() => setActiveView('CLIENT_DASHBOARD')}
                activeOrders={orders.filter(o => o.tenantId === currentTenant.id)}
              />
            )}

            {activeView === 'CLIENT_DASHBOARD' && (
              <RestaurantDashboard
                tenant={currentTenant}
                onUpdateTenant={handleUpdateTenant}
                onSwitchToPublicMenu={(t) => {
                  if (t) setTableNumber(t);
                  setActiveView('PUBLIC_MENU');
                }}
                waiterCalls={waiterCalls}
                onDismissWaiterCall={handleDismissWaiterCall}
                onBackToSuperAdmin={() => setActiveView('SUPER_ADMIN')}
                onOpenTasTripDashboard={() => setActiveView('TASTE_TRIP')}
              />
            )}

            {activeView === 'PRO_OPERATIONS' && (
              canAccessProOperations ? (
                <ProPosKot
                  tenant={currentTenant}
                  orders={orders.filter(o => o.tenantId === currentTenant.id)}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onAddNewOrder={handleAddNewOrder}
                  onOpenCustomerMenu={() => setActiveView('PUBLIC_MENU')}
                />
              ) : (
                <RbacBarrier
                  requiredTier="PRO"
                  currentTier={currentUser?.tier || 'FREE'}
                  featureName="Pro POS Terminal & Kitchen Display System (KDS)"
                  onUpgrade={() => {
                    handleUpdateTenant({ ...currentTenant, tier: 'PRO' });
                    if (currentUser) {
                      setCurrentUser({ ...currentUser, tier: 'PRO' });
                    }
                  }}
                  onSwitchUser={() => setIsAuthModalOpen(true)}
                  onGoBack={() => setActiveView('CLIENT_DASHBOARD')}
                />
              )
            )}

            {activeView === 'SUPER_ADMIN' && (
              canAccessSuperAdmin ? (
                <SuperAdminPanel
                  tenants={tenants}
                  onSelectTenant={(id) => setCurrentTenantId(id)}
                  onUpdateTenantStatus={handleUpdateTenantStatus}
                  onCreateTenant={handleCreateTenant}
                  onSwitchToTenantDashboard={(id) => {
                    setCurrentTenantId(id);
                    setActiveView('CLIENT_DASHBOARD');
                  }}
                  onNavigateToTasteTrip={() => setActiveView('TASTE_TRIP')}
                  onUpdateTenant={handleUpdateTenant}
                  drivers={drivers}
                  onClearDemoOrders={handleClearDemoOrders}
                  onResetAllDemoData={handleResetAllDemoData}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                />
              ) : (
                <RbacBarrier
                  requiredRole="SUPER_ADMIN"
                  currentRole={currentUser?.role}
                  currentTier={currentUser?.tier || 'FREE'}
                  featureName="Ceyteq Master Cloud Management Console"
                  onSwitchUser={() => setIsAuthModalOpen(true)}
                  onGoBack={() => setActiveView('CLIENT_DASHBOARD')}
                />
              )
            )}

            {activeView === 'SECURITY_CENTER' && (
              <SecurityCenter
                currentUser={currentUser}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}

            {(activeView === 'TASTE_TRIP' || (activeView as any) === 'TASTRIP_DASHBOARD') && (
              <TasteTripEcosystem
                tenants={tenants}
                drivers={drivers}
                deployments={deployments}
                onBackToDigitalRace={() => setActiveView('CLIENT_DASHBOARD')}
                onSelectTenant={(id) => setCurrentTenantId(id)}
              />
            )}

            {activeView === 'ANALYTICS' && (
              <AnalyticsDashboard
                tenants={tenants}
                currentTenantId={currentTenantId}
                onSelectTenant={(id) => setCurrentTenantId(id)}
                onNavigateToDashboard={(id) => {
                  setCurrentTenantId(id);
                  setActiveView('CLIENT_DASHBOARD');
                }}
              />
            )}

            {activeView === 'ARCHITECTURE' && (
              <ArchitectureHub tenants={tenants} />
            )}
          </main>
        </div>

        {/* Multi-Portal Launcher & Real-Time Sync Modal */}
        <PortalLauncherModal
          isOpen={isPortalLauncherOpen}
          onClose={() => setIsPortalLauncherOpen(false)}
          currentTenant={currentTenant}
          tableNumber={tableNumber}
          onSelectPortal={(view, standalone) => {
            setActiveView(view);
            if (standalone !== undefined) setIsStandalone(standalone);
          }}
          isStandalone={isStandalone}
          onToggleStandalone={setIsStandalone}
        />

        {/* Enterprise Authentication, OTP, 2FA, Passwords & Data Cleanup Modal */}
        <SecurityAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          tenants={tenants}
          onClearDemoOrders={handleClearDemoOrders}
          onResetAllDemoData={handleResetAllDemoData}
          onOpenCreateRestaurant={() => {
            setIsAuthModalOpen(false);
            setActiveView('SUPER_ADMIN');
          }}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            credentialsService.setCurrentSessionUser(user);
            setIsAuthModalOpen(false);
            setIsLoginGateOpen(false);
          }}
          onLogout={() => {
            credentialsService.setCurrentSessionUser(null);
            setCurrentUser(null);
            setActiveView('PUBLIC_MENU');
            setIsAuthModalOpen(false);
            setIsLoginGateOpen(false);
          }}
        />
      </div>
    </GlobalErrorBoundary>
  );
}
