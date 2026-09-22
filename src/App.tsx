import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerUI } from './components/CustomerUI';
import { ProPosKot } from './components/ProPosKot';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ArchitectureHub } from './components/ArchitectureHub';
import { TasteTripEcosystem } from './components/TasteTripEcosystem';
import { SilkWaveBackdrop } from './components/SilkWaveBackdrop';
import { INITIAL_TENANTS, INITIAL_ORDERS, INITIAL_DRIVERS, INITIAL_DEPLOYMENTS, generateTenantDailyTrends } from './mockData';
import { ActiveView, Tenant, TenantStatus, WaiterRequest, CustomerOrder, DeliveryDriver, TasteTripDeployment } from './types';

export default function App() {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [currentTenantId, setCurrentTenantId] = useState<string>(INITIAL_TENANTS[0].id);
  const [activeView, setActiveView] = useState<ActiveView>('PUBLIC_MENU');
  const [tableNumber, setTableNumber] = useState<number>(4);
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>(INITIAL_DRIVERS);
  const [deployments, setDeployments] = useState<TasteTripDeployment[]>(INITIAL_DEPLOYMENTS);

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

  const currentTenant = tenants.find(t => t.id === currentTenantId) || tenants[0];

  // Update tenant details (food prices, stock status, custom domain)
  const handleUpdateTenant = (updatedTenant: Tenant) => {
    setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
  };

  // Update status (e.g. Super admin disables or enables access)
  const handleUpdateTenantStatus = (tenantId: string, status: TenantStatus) => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status } : t));
  };

  // Create new tenant from Super Admin
  const handleCreateTenant = (data: Partial<Tenant>) => {
    const newId = `tenant-${Date.now()}`;
    const newTenant: Tenant = {
      id: newId,
      name: data.name || 'New Restaurant',
      slug: data.slug || 'new-restaurant',
      ownerName: data.ownerName || 'Restaurant Owner',
      ownerEmail: data.ownerEmail || 'owner@restaurant.com',
      status: 'ACTIVE',
      plan: data.plan || 'PRO',
      monthlyFee: data.plan === 'STARTER' ? 29 : data.plan === 'ENTERPRISE' ? 149 : 69,
      createdAt: new Date().toISOString().split('T')[0],
      subdomain: data.slug || 'new-restaurant',
      customDomain: data.customDomain,
      customDomainVerified: false,
      dnsStatus: data.customDomain ? 'PENDING' : 'NOT_CONFIGURED',
      dnsExpectedCname: 'cname.ceyteq.com',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
      accentColor: '#e11d48',
      phone: '+94 11 000 0000',
      address: 'Colombo, Sri Lanka',
      currency: 'LKR',
      tableCount: 15,
      totalViews: 950,
      totalOrders: 86,
      tier: 'PRO',
      palette: 'PALETTE_1',
      socialLinks: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        tiktok: 'https://tiktok.com',
        whatsapp: '+94770000000',
        showFacebook: true,
        showInstagram: true,
        showTiktok: false,
        showYoutube: false,
        showWhatsapp: true,
      },
      deliveryEnabled: true,
      paymentGatewayEnabled: true,
      whatsappMessagingEnabled: true,
      dailyTrends: generateTenantDailyTrends(950, 86, 2200),
      categories: [
        { id: `cat-1-${newId}`, name: 'Signature Dishes', nameSi: 'විශේෂ ආහාර', iconName: 'Sparkles', order: 1 },
        { id: `cat-2-${newId}`, name: 'Beverages', nameSi: 'බීම වර්ග', iconName: 'Coffee', order: 2 },
      ],
      products: [
        {
          id: `prod-1-${newId}`,
          name: 'Signature Chef Special',
          nameSi: 'විශේෂ කෑම',
          description: 'Authentic chef selected recipe with fresh herbs and spices.',
          price: 2200,
          currency: 'LKR',
          categoryId: `cat-1-${newId}`,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
          isAvailable: true,
          isHalal: true,
          preparationTime: '15 mins',
        }
      ]
    };

    setTenants([newTenant, ...tenants]);
    setCurrentTenantId(newId);
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
  };

  // Dismiss waiter call from dashboard
  const handleDismissWaiterCall = (callId: string) => {
    setWaiterCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'ATTENDED' } : c));
  };

  // Place order from Customer UI
  const handlePlaceOrder = (newOrder: CustomerOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    // increment tenant totalOrders count
    setTenants(prev => prev.map(t => 
      t.id === newOrder.tenantId ? { ...t, totalOrders: t.totalOrders + 1 } : t
    ));
  };

  // Update order status from KOT / Kitchen
  const handleUpdateOrderStatus = (orderId: string, status: CustomerOrder['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // Add order from Walk-in POS
  const handleAddNewOrder = (newOrder: CustomerOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    setTenants(prev => prev.map(t => 
      t.id === newOrder.tenantId ? { ...t, totalOrders: t.totalOrders + 1 } : t
    ));
  };

  return (
    <div className="min-h-screen bg-silk-light-gradient text-slate-900 flex flex-col font-sans relative">
      {/* Background silk wave drape matching user's image */}
      <SilkWaveBackdrop />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          activeView={activeView}
          setActiveView={setActiveView}
          tenants={tenants}
          currentTenantId={currentTenantId}
          onSelectTenant={setCurrentTenantId}
          waiterCalls={waiterCalls}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
        />

        <main className="flex-1">
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
          <ProPosKot
            tenant={currentTenant}
            orders={orders.filter(o => o.tenantId === currentTenant.id)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddNewOrder={handleAddNewOrder}
            onOpenCustomerMenu={() => setActiveView('PUBLIC_MENU')}
          />
        )}

        {activeView === 'SUPER_ADMIN' && (
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
    </div>
  );
}
