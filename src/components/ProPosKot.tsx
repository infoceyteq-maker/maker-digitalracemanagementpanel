import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  ChefHat, 
  Printer, 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Search, 
  Plus, 
  Minus, 
  X, 
  UserCheck, 
  Building2, 
  Receipt, 
  BarChart3, 
  ShieldCheck, 
  Bell, 
  ShoppingBag, 
  Tag, 
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Tenant, Product, CustomerOrder, UserRole } from '../types';

interface ProPosKotProps {
  tenant: Tenant;
  orders: CustomerOrder[];
  onUpdateOrderStatus: (orderId: string, status: CustomerOrder['status']) => void;
  onAddNewOrder: (order: CustomerOrder) => void;
  onOpenCustomerMenu?: () => void;
}

export const ProPosKot: React.FC<ProPosKotProps> = ({
  tenant,
  orders,
  onUpdateOrderStatus,
  onAddNewOrder,
  onOpenCustomerMenu,
}) => {
  // 5 Departments in Pro Tier
  const [activeRole, setActiveRole] = useState<'MASTER_ADMIN' | 'MANAGER' | 'KITCHEN' | 'FRONT' | 'FINANCE'>('FRONT');
  
  // Tab inside Pro Operations
  const [activeSection, setActiveSection] = useState<'POS' | 'KOT' | 'FINANCE'>('POS');

  // POS State
  const [posSelectedCategory, setPosSelectedCategory] = useState<string>('ALL');
  const [posSearch, setPosSearch] = useState('');
  const [posTable, setPosTable] = useState<number | 'WALK_IN'>(1);
  const [posCustomerName, setPosCustomerName] = useState('Walk-in Customer');
  const [posCart, setPosCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');

  // Thermal Receipt / Bill Printing Modal
  const [printedBillOrder, setPrintedBillOrder] = useState<CustomerOrder | null>(null);

  // KOT Filter
  const [kotFilter, setKotFilter] = useState<'ALL' | 'RECEIVED' | 'COOKING' | 'READY'>('ALL');

  // POS Add item
  const handlePosAddToCart = (product: Product) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handlePosRemoveFromCart = (productId: string) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.product.id !== productId);
    });
  };

  const posSubtotal = posCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const posTax = Math.round(posSubtotal * 0.1);
  const posTotal = posSubtotal + posTax;

  // Dispatch POS Order to Kitchen KOT
  const handleDispatchPosOrder = (instantPayAndPrint: boolean = false) => {
    if (posCart.length === 0) return;

    const newOrder: CustomerOrder = {
      id: `pos-${Date.now()}`,
      kotNumber: `KOT-#${Math.floor(100 + Math.random() * 900)}`,
      tenantId: tenant.id,
      orderType: typeof posTable === 'number' ? 'DINE_IN' : 'TAKEAWAY',
      tableNumber: typeof posTable === 'number' ? posTable : undefined,
      customerName: posCustomerName.trim() || 'POS Walk-in',
      customerPhone: '+94 77 000 0000',
      items: posCart.map(c => ({ product: c.product, quantity: c.quantity })),
      subtotal: posSubtotal,
      tax: posTax,
      total: posTotal,
      paymentMethod: posPaymentMethod,
      paymentStatus: instantPayAndPrint ? 'PAID' : 'PENDING',
      status: 'COOKING',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeAgo: 'Just now',
    };

    onAddNewOrder(newOrder);
    setPosCart([]);

    if (instantPayAndPrint) {
      setPrintedBillOrder(newOrder);
    }
  };

  // Filter KOT orders
  const filteredKotOrders = orders.filter(o => {
    if (kotFilter === 'ALL') return o.status !== 'CANCELLED';
    return o.status === kotFilter;
  });

  // Calculate Finance Summary
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const cardRevenue = orders.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.total, 0);
  const cashRevenue = orders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
  const completedOrdersCount = orders.filter(o => o.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen text-slate-800 font-sans pb-16">
      
      {/* Top Operations Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-sky-100 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
                PRO
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {tenant.name} - Operations Center
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Tier 3: Pro Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Integrated Point of Sale (POS), Kitchen Order Tickets (KOT), and 5-Department Access Control.
            </p>
          </div>

          {/* 5-Department RBAC Switcher */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-sky-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 pl-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-pink-600" />
              <span>Role:</span>
            </span>

            {(['MASTER_ADMIN', 'MANAGER', 'KITCHEN', 'FRONT', 'FINANCE'] as const).map(role => (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  if (role === 'KITCHEN') setActiveSection('KOT');
                  if (role === 'FRONT') setActiveSection('POS');
                  if (role === 'FINANCE') setActiveSection('FINANCE');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeRole === role
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                }`}
              >
                {role === 'MASTER_ADMIN' && 'Master'}
                {role === 'MANAGER' && 'Manager'}
                {role === 'KITCHEN' && 'Kitchen'}
                {role === 'FRONT' && 'Front (POS)'}
                {role === 'FINANCE' && 'Finance'}
              </button>
            ))}
          </div>
        </div>

        {/* View Section Tabs */}
        <div className="max-w-7xl mx-auto flex items-center gap-3 mt-4 border-t border-sky-100 pt-3">
          <button
            onClick={() => setActiveSection('POS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'POS'
                ? 'bg-white text-slate-900 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
            <span>Walk-in POS Terminal</span>
          </button>

          <button
            onClick={() => setActiveSection('KOT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeSection === 'KOT'
                ? 'bg-white text-slate-900 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ChefHat className="w-4 h-4 text-pink-600" />
            <span>Kitchen KOT Display Board</span>
            {orders.filter(o => o.status === 'RECEIVED' || o.status === 'COOKING').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveSection('FINANCE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'FINANCE'
                ? 'bg-white text-slate-900 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Finance & Sales Reconciliation</span>
          </button>
        </div>
      </header>

      {/* SECTION 1: POINT OF SALE (POS) */}
      {activeSection === 'POS' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Product Catalog & Search */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Category Pills & Search Bar */}
              <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Quick search dishes or kottu..."
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  {/* Table Selector */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Table:</span>
                    <select
                      value={posTable}
                      onChange={(e) => setPosTable(e.target.value === 'WALK_IN' ? 'WALK_IN' : Number(e.target.value))}
                      className="bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-bold text-pink-600 focus:outline-none"
                    >
                      <option value="WALK_IN">Walk-In Takeaway</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20, 24].map(n => (
                        <option key={n} value={n}>Table #{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                  <button
                    onClick={() => setPosSelectedCategory('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      posSelectedCategory === 'ALL'
                        ? 'bg-pink-600 text-white shadow-2xs'
                        : 'bg-white border border-sky-200 text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                    }`}
                  >
                    All Dishes
                  </button>
                  {tenant.categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setPosSelectedCategory(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        posSelectedCategory === c.id
                          ? 'bg-pink-600 text-white shadow-2xs'
                          : 'bg-white border border-sky-200 text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dishes Touch Screen Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {tenant.products
                  .filter(p => {
                    const matchCat = posSelectedCategory === 'ALL' || p.categoryId === posSelectedCategory;
                    const matchQ = p.name.toLowerCase().includes(posSearch.toLowerCase());
                    return matchCat && matchQ;
                  })
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePosAddToCart(p)}
                      className="group p-3 rounded-2xl bg-white border border-sky-100 hover:border-pink-300 text-left transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between shadow-2xs hover:shadow-md"
                    >
                      <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-slate-100">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-black text-amber-300 font-mono">
                          {p.currency} {p.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-pink-600 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {p.preparationTime || '10 mins'}
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Right: Active POS Ticket & Actions */}
            <div className="lg:col-span-4 bg-white/95 backdrop-blur-md border border-sky-100 rounded-2xl p-5 sticky top-24 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-pink-600" />
                    <span>Current POS Ticket</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {typeof posTable === 'number' ? `Dine-In Table #${posTable}` : 'Takeaway Order'}
                  </span>
                </div>
                {posCart.length > 0 && (
                  <button 
                    onClick={() => setPosCart([])}
                    className="text-[11px] text-pink-600 hover:text-pink-700 font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="py-3 max-h-72 overflow-y-auto space-y-2">
                {posCart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Tap dishes on the left to add items to ticket.
                  </div>
                ) : (
                  posCart.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center justify-between p-2 rounded-xl bg-sky-50/50 border border-sky-100 text-xs">
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-slate-900 line-clamp-1">{product.name}</div>
                        <div className="text-[11px] text-pink-600 font-semibold font-mono">
                          {product.currency} {(product.price * quantity).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePosRemoveFromCart(product.id)}
                          className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-sky-100 border border-sky-200 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold text-slate-900 px-1">{quantity}</span>
                        <button
                          onClick={() => handlePosAddToCart(product)}
                          className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-sky-100 border border-sky-200 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pricing Totals */}
              {posCart.length > 0 && (
                <div className="pt-3 border-t border-sky-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{tenant.currency} {posSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT / Service (10%):</span>
                    <span>{tenant.currency} {posTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-sky-100">
                    <span>Grand Total:</span>
                    <span className="text-pink-600 font-mono">{tenant.currency} {posTotal.toLocaleString()}</span>
                  </div>

                  {/* Payment Method Toggle */}
                  <div className="pt-2">
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                      Payment Tender:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPosPaymentMethod('CASH')}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          posPaymentMethod === 'CASH'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'bg-white border-sky-200 text-slate-600'
                        }`}
                      >
                        Cash Tender
                      </button>
                      <button
                        onClick={() => setPosPaymentMethod('CARD')}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          posPaymentMethod === 'CARD'
                            ? 'bg-pink-50 border-pink-500 text-pink-700'
                            : 'bg-white border-sky-200 text-slate-600'
                        }`}
                      >
                        Card Terminal
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-3">
                    <button
                      onClick={() => handleDispatchPosOrder(false)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <ChefHat className="w-4 h-4 text-amber-400" />
                      <span>Send to Kitchen (Print KOT)</span>
                    </button>

                    <button
                      onClick={() => handleDispatchPosOrder(true)}
                      className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/20 transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Instant Pay & Print Bill</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* SECTION 2: KITCHEN ORDER TICKETS (KOT) LIVE BOARD */}
      {activeSection === 'KOT' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-pink-600" />
                <span>Live Kitchen Display System (KDS / KOT)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time tickets received from QR dine-in scans, remote delivery, and front-counter POS.
              </p>
            </div>

            {/* KOT Status Filter */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-sky-200 shadow-2xs">
              {(['ALL', 'RECEIVED', 'COOKING', 'READY'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setKotFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    kotFilter === status
                      ? 'bg-pink-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* KOT Tickets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKotOrders.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-2xl bg-white/90 border border-sky-100 p-8 shadow-sm">
                <ChefHat className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900">No tickets in this state</h3>
                <p className="text-xs text-slate-500 mt-1">All kitchen orders have been prepared and served.</p>
              </div>
            ) : (
              filteredKotOrders.map(order => {
                const isUrgent = order.status === 'RECEIVED' || order.status === 'COOKING';

                return (
                  <div 
                    key={order.id}
                    className={`rounded-2xl p-5 border flex flex-col justify-between transition-all shadow-sm ${
                      order.status === 'RECEIVED'
                        ? 'bg-white border-amber-400 shadow-amber-500/10'
                        : order.status === 'COOKING'
                        ? 'bg-white border-pink-400 shadow-pink-500/10'
                        : 'bg-white border-emerald-400 shadow-emerald-500/10'
                    }`}
                  >
                    <div>
                      {/* Top Ticket Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {order.kotNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                            {order.orderType === 'DINE_IN' ? `Table #${order.tableNumber}` : order.orderType}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.createdAt}</span>
                        </div>
                      </div>

                      {/* Customer / Notes */}
                      <div className="py-2 text-xs">
                        <span className="text-slate-500 font-semibold">Guest: </span>
                        <span className="text-slate-900 font-bold">{order.customerName}</span>
                        {order.notes && (
                          <div className="mt-1 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                            <span>{order.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Item Checklist */}
                      <div className="py-2 space-y-2 border-t border-slate-100">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between text-xs">
                            <div className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 font-mono font-black flex items-center justify-center text-xs shrink-0">
                                {item.quantity}×
                              </span>
                              <div>
                                <span className="font-bold text-slate-900">{item.product.name}</span>
                                {item.notes && (
                                  <span className="block text-[10px] text-amber-700 italic">"{item.notes}"</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Current Status:</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          order.status === 'RECEIVED' ? 'text-amber-700 bg-amber-50' :
                          order.status === 'COOKING' ? 'text-pink-700 bg-pink-50 animate-pulse' :
                          'text-emerald-700 bg-emerald-50'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'COOKING')}
                          disabled={order.status === 'COOKING' || order.status === 'READY' || order.status === 'COMPLETED'}
                          className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold text-amber-800"
                        >
                          Cooking
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'READY')}
                          disabled={order.status === 'READY' || order.status === 'COMPLETED'}
                          className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold text-sky-800"
                        >
                          Ready
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'COMPLETED')}
                          disabled={order.status === 'COMPLETED'}
                          className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white"
                        >
                          Served
                        </button>
                      </div>

                      <button
                        onClick={() => setPrintedBillOrder(order)}
                        className="w-full py-1.5 rounded-lg bg-white border border-sky-200 hover:bg-sky-50 text-[11px] text-slate-700 font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print Bill Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* SECTION 3: FINANCE & SALES RECONCILIATION */}
      {activeSection === 'FINANCE' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Finance Department: Sales & Settlement Audit</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Daily revenue breakdown, cash vs credit card settlement, and KOT transaction logs.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <div className="text-xs text-slate-500 font-semibold mb-1">Total Sales Today</div>
              <div className="text-2xl font-black text-slate-900 font-mono">{tenant.currency} {totalRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Across {orders.length} tickets</span>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <div className="text-xs text-slate-500 font-semibold mb-1">Card Gateway Settlements</div>
              <div className="text-2xl font-black text-pink-600 font-mono">{tenant.currency} {cardRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">Direct to Bank Merchant A/C</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <div className="text-xs text-slate-500 font-semibold mb-1">Cash Drawer Tender</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">{tenant.currency} {cashRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">Cash In Register Till</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-sm">
              <div className="text-xs text-slate-500 font-semibold mb-1">Completed Tickets</div>
              <div className="text-2xl font-black text-slate-900 font-mono">{completedOrdersCount} / {orders.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Kitchen Fulfillment Rate 98%</div>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-sky-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Transaction Reconciliation Journal
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sky-50/70 text-slate-600 border-b border-sky-100">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Tax (10%)</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-sky-50/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.kotNumber}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {o.orderType === 'DINE_IN' ? `Table #${o.tableNumber}` : o.orderType}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{o.customerName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.paymentMethod === 'CARD' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {tenant.currency} {o.tax.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {tenant.currency} {o.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setPrintedBillOrder(o)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* THERMAL BILL RECEIPT PRINTING MODAL (Physical 80mm ESC/POS layout) */}
      {printedBillOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center">
            
            {/* Thermal Receipt Paper Effect */}
            <div className="w-full bg-white text-slate-900 p-5 rounded-xl border border-slate-200 shadow-sm font-mono text-xs space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h3 className="font-black text-sm uppercase tracking-wide text-black">
                  {tenant.name}
                </h3>
                <p className="text-[10px] text-slate-600 mt-0.5">{tenant.address}</p>
                <p className="text-[10px] text-slate-600">Tel: {tenant.phone}</p>
                <div className="text-[9px] bg-slate-100 mt-1 py-0.5 font-bold uppercase">
                  Tax Invoice / Customer Receipt
                </div>
              </div>

              <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Ticket No:</span>
                  <strong>{printedBillOrder.kotNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Date/Time:</span>
                  <span>{new Date().toLocaleDateString()} {printedBillOrder.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <strong>{printedBillOrder.orderType === 'DINE_IN' ? `Table #${printedBillOrder.tableNumber}` : 'Takeaway / Delivery'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>Front POS (Emp #04)</span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="py-1 space-y-1.5 text-[11px]">
                {printedBillOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="line-clamp-1">{it.quantity}x {it.product.name}</span>
                    <span className="shrink-0 pl-2">{(it.product.price * it.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-dashed border-slate-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{tenant.currency} {printedBillOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service & Tax (10%):</span>
                  <span>{tenant.currency} {printedBillOrder.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-900">
                  <span>NET TOTAL:</span>
                  <span>{tenant.currency} {printedBillOrder.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Payment Tender:</span>
                  <strong>{printedBillOrder.paymentMethod} (PAID)</strong>
                </div>
              </div>

              {/* Barcode & Footer */}
              <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-600">
                <div className="font-mono tracking-widest text-xs font-black text-black">
                  ||||| | |||| |||||| || | |||||
                </div>
                <p className="mt-1 font-bold">Thank you for dining with us!</p>
                <p className="text-[9px]">Powered by Digital Race • Ceyteq</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full mt-4">
              <button
                onClick={() => setPrintedBillOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
