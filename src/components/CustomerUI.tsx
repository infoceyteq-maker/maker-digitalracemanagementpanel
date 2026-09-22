import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Fish, 
  Utensils, 
  Coffee, 
  IceCream, 
  Wine, 
  Wifi, 
  Phone, 
  MapPin, 
  Clock, 
  Bell, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Globe, 
  CheckCircle2, 
  Smartphone, 
  Download, 
  CreditCard, 
  Bike, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  Share2,
  Lock,
  MessageCircle,
  Truck,
  RotateCcw
} from 'lucide-react';
import { Tenant, Product, CartItem, CustomerOrder, ThemePalette } from '../types';
import { THEME_PALETTES } from '../lib/themePalettes';

interface CustomerUIProps {
  tenant: Tenant;
  tableNumber?: number;
  onCallWaiter?: (table: number, type: string) => void;
  onPlaceOrder?: (order: CustomerOrder) => void;
  onOpenDashboard?: () => void;
  activeOrders?: CustomerOrder[];
}

export const CustomerUI: React.FC<CustomerUIProps> = ({
  tenant,
  tableNumber = 4,
  onCallWaiter,
  onPlaceOrder,
  onOpenDashboard,
  activeOrders = [],
}) => {
  // Order mode: Dine-in via QR scan OR Remote Delivery
  const [orderMode, setOrderMode] = useState<'DINE_IN' | 'DELIVERY'>('DINE_IN');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'SPICY' | 'HALAL'>('ALL');
  const [language, setLanguage] = useState<'EN' | 'SI'>('EN');
  
  // Theme palette preview override
  const [currentPaletteId, setCurrentPaletteId] = useState<ThemePalette>(tenant.palette || 'PALETTE_1');
  const palette = THEME_PALETTES[currentPaletteId] || THEME_PALETTES.PALETTE_1;

  // Cart & Modals
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [waiterFeedback, setWaiterFeedback] = useState<string | null>(null);

  // Delivery / Customer info form
  const [customerName, setCustomerName] = useState('Anuki Perera');
  const [customerPhone, setCustomerPhone] = useState('+94 77 987 6543');
  const [deliveryAddress, setDeliveryAddress] = useState('No. 18, Flower Road, Colombo 07');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CARD');

  // Card Payment Gateway Simulation
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState<CustomerOrder | null>(null);

  // Active tracking order tab
  const [trackedOrder, setTrackedOrder] = useState<CustomerOrder | null>(null);

  // Filtered dishes
  const filteredProducts = tenant.products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameSi && p.nameSi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDietary = true;
    if (dietaryFilter === 'VEG') matchesDietary = !!p.isVegetarian;
    if (dietaryFilter === 'SPICY') matchesDietary = !!p.isSpicy;
    if (dietaryFilter === 'HALAL') matchesDietary = !!p.isHalal;

    return matchesCategory && matchesSearch && matchesDietary;
  });

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5" />;
      case 'Flame': return <Flame className="w-3.5 h-3.5" />;
      case 'Fish': return <Fish className="w-3.5 h-3.5" />;
      case 'Coffee': return <Coffee className="w-3.5 h-3.5" />;
      case 'IceCream': return <IceCream className="w-3.5 h-3.5" />;
      case 'Wine': return <Wine className="w-3.5 h-3.5" />;
      default: return <Utensils className="w-3.5 h-3.5" />;
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const deliveryFee = orderMode === 'DELIVERY' ? 350 : 0;
  const tax = Math.round(cartSubtotal * 0.1); // 10% service/tax
  const cartGrandTotal = cartSubtotal + deliveryFee + tax;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsProcessingPayment(true);

    setTimeout(() => {
      const newOrder: CustomerOrder = {
        id: `ord-${Date.now()}`,
        kotNumber: `KOT-#${Math.floor(100 + Math.random() * 900)}`,
        tenantId: tenant.id,
        orderType: orderMode,
        tableNumber: orderMode === 'DINE_IN' ? tableNumber : undefined,
        customerName: customerName.trim() || 'Guest Customer',
        customerPhone: customerPhone.trim() || '+94 77 000 0000',
        deliveryAddress: orderMode === 'DELIVERY' ? deliveryAddress : undefined,
        notes: orderNotes,
        items: [...cart],
        subtotal: cartSubtotal,
        tax: tax,
        total: cartGrandTotal,
        paymentMethod,
        paymentStatus: paymentMethod === 'CARD' ? 'PAID' : 'PENDING',
        status: 'RECEIVED',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeAgo: 'Just now',
      };

      if (onPlaceOrder) {
        onPlaceOrder(newOrder);
      }

      setCart([]);
      setIsProcessingPayment(false);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setPaymentSuccessOrder(newOrder);
      setTrackedOrder(newOrder);
    }, 1200);
  };

  const handleTriggerWaiterCall = (type: string, label: string) => {
    if (onCallWaiter) {
      onCallWaiter(tableNumber, type);
    }
    setWaiterFeedback(label);
    setTimeout(() => {
      setIsWaiterModalOpen(false);
      setWaiterFeedback(null);
    }, 1800);
  };

  return (
    <div className={`min-h-screen ${palette.colors.bg} ${palette.colors.textPrimary} transition-colors duration-300 font-sans pb-28`}>
      
      {/* Quick Interactive Palette Switcher Bar (For testing the 3 required themes) */}
      <aside aria-label="Customer Preview Controls" className="bg-white/90 text-slate-700 px-4 py-2 border-b border-sky-100 text-xs backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Customer UI Theme:</span>
            </span>
            <div className="flex items-center gap-1.5 bg-sky-50/80 p-1 rounded-lg border border-sky-200">
              <button
                onClick={() => setCurrentPaletteId('PALETTE_1')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  currentPaletteId === 'PALETTE_1' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Crimson Rose Light"
              >
                1. Crimson Rose
              </button>
              <button
                onClick={() => setCurrentPaletteId('PALETTE_2')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  currentPaletteId === 'PALETTE_2' ? 'bg-green-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="White, Green, Yellow, Black, Hash"
              >
                2. Fresh Lime
              </button>
              <button
                onClick={() => setCurrentPaletteId('PALETTE_3')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  currentPaletteId === 'PALETTE_3' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="White, Emerald Green, Yellow, Hash"
              >
                3. Emerald Gold
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPwaModalOpen(true)}
              className="flex items-center gap-1 text-[11px] bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-md hover:bg-amber-100 font-semibold transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container - Optimized for mobile-first view (max-w-md or max-w-lg centered) */}
      <main className="max-w-md sm:max-w-lg mx-auto bg-transparent relative">
        
        {/* Cover Hero Banner */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-900 shadow-sm">
          <img 
            src={tenant.coverImageUrl} 
            alt={tenant.name}
            className="w-full h-full object-cover brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Top Floating Action Bar */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-sky-100 text-xs font-bold text-slate-900 shadow-sm">
                <QrCode className="w-3.5 h-3.5 text-pink-600" />
                <span>{orderMode === 'DINE_IN' ? `Table #${tableNumber}` : 'Delivery Mode'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'EN' ? 'SI' : 'EN')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-sky-100 text-xs font-bold text-slate-800 hover:bg-white shadow-sm transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-[#008BB8]" />
                <span>{language === 'EN' ? 'සිංහල' : 'English'}</span>
              </button>

              {/* Guest WiFi */}
              {tenant.wifiSsid && (
                <button
                  onClick={() => setIsWifiModalOpen(true)}
                  className="p-1.5 rounded-full bg-white/90 backdrop-blur-md border border-sky-100 text-emerald-600 hover:bg-white shadow-sm transition-all"
                  title="Guest WiFi"
                >
                  <Wifi className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Restaurant Title & Logo */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3 z-10">
            <img 
              src={tenant.logoUrl} 
              alt={tenant.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
            />
            <div className="text-white">
              <h1 className="text-lg sm:text-xl font-black leading-tight drop-shadow">
                {tenant.name}
              </h1>
              <p className="text-[11px] text-white/90 line-clamp-1 flex items-center gap-1 mt-0.5 font-medium">
                <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
                <span>{tenant.address}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Social Media Links Bar (Configurable from Restaurant Admin) */}
        {tenant.socialLinks && (
          <div className="px-4 py-2.5 border-b border-sky-100 bg-white/80 backdrop-blur-sm flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-slate-500">Connect with us:</span>
            <div className="flex items-center gap-2">
              {tenant.socialLinks.showWhatsapp && (
                <a 
                  href={`https://wa.me/${tenant.socialLinks.whatsapp?.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-1.5 rounded-full bg-emerald-600 text-white hover:opacity-90 shadow-2xs"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
              {tenant.socialLinks.showFacebook && (
                <a 
                  href={tenant.socialLinks.facebook || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-1.5 rounded-full bg-blue-600 text-white hover:opacity-90 shadow-2xs"
                  title="Facebook"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </a>
              )}
              {tenant.socialLinks.showInstagram && (
                <a 
                  href={tenant.socialLinks.instagram || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-1.5 rounded-full bg-pink-600 text-white hover:opacity-90 shadow-2xs"
                  title="Instagram"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </a>
              )}
              {tenant.socialLinks.showTiktok && (
                <a 
                  href={tenant.socialLinks.tiktok || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-1.5 rounded-full bg-slate-900 text-white hover:opacity-90 border border-slate-700 shadow-2xs"
                  title="TikTok"
                >
                  <span className="text-[10px] font-black px-0.5">TT</span>
                </a>
              )}
              {tenant.phone && (
                <a 
                  href={`tel:${tenant.phone}`} 
                  className="p-1.5 rounded-full bg-sky-50 text-slate-700 hover:bg-sky-100 border border-sky-200"
                  title="Call Restaurant"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Order Mode Toggle (Dine-in Table vs Remote Delivery) */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/90 border border-sky-100 shadow-2xs">
            <button
              onClick={() => setOrderMode('DINE_IN')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                orderMode === 'DINE_IN'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Dine-In (Table #{tableNumber})</span>
            </button>

            <button
              onClick={() => setOrderMode('DELIVERY')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                orderMode === 'DELIVERY'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Delivery & Takeaway</span>
            </button>
          </div>
        </div>

        {/* Tracked Order Banner (If an order was recently placed or active) */}
        {trackedOrder && (
          <div className="mx-3 mb-3 p-3 rounded-2xl bg-white/95 border border-amber-300 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-slate-900">{trackedOrder.kotNumber} In Progress</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Status: {trackedOrder.status}
              </span>
            </div>

            {/* Progress stages */}
            <div className="grid grid-cols-4 gap-1.5 mt-2 text-[10px] text-center font-bold">
              <div className={`p-1.5 rounded-lg ${['RECEIVED', 'COOKING', 'READY', 'COMPLETED'].includes(trackedOrder.status) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                1. Received
              </div>
              <div className={`p-1.5 rounded-lg ${['COOKING', 'READY', 'COMPLETED'].includes(trackedOrder.status) ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                2. Cooking
              </div>
              <div className={`p-1.5 rounded-lg ${['READY', 'COMPLETED'].includes(trackedOrder.status) ? 'bg-[#008BB8] text-white' : 'bg-slate-100 text-slate-400'}`}>
                3. Ready
              </div>
              <div className={`p-1.5 rounded-lg ${trackedOrder.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                4. Done
              </div>
            </div>
          </div>
        )}

        {/* Search & Dietary Filters */}
        <div className="px-3 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={language === 'EN' ? "Search delicious food, kottu, drinks..." : "කෑම, බීම වර්ග සොයන්න..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#008BB8] shadow-2xs"
            />
          </div>

          {/* Dietary Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              onClick={() => setDietaryFilter('ALL')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
                dietaryFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-600 border border-sky-200 hover:bg-sky-50'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietaryFilter('SPICY')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 whitespace-nowrap ${
                dietaryFilter === 'SPICY'
                  ? 'bg-rose-600 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-600 border border-sky-200 hover:bg-sky-50'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-500" />
              <span>Spicy / සැර</span>
            </button>
            <button
              onClick={() => setDietaryFilter('VEG')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 whitespace-nowrap ${
                dietaryFilter === 'VEG'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-600 border border-sky-200 hover:bg-sky-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Vegetarian / එළවළු</span>
            </button>
            <button
              onClick={() => setDietaryFilter('HALAL')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
                dietaryFilter === 'HALAL'
                  ? 'bg-sky-600 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-600 border border-sky-200 hover:bg-sky-50'
              }`}
            >
              Halal Certified
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-3 mt-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-white border border-sky-100 text-slate-700 hover:bg-sky-50'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>All Menu ({tenant.products.length})</span>
            </button>

            {tenant.categories.map((cat) => {
              const count = tenant.products.filter(p => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-white border border-sky-100 text-slate-700 hover:bg-sky-50'
                  }`}
                >
                  {getCategoryIcon(cat.iconName)}
                  <span>{language === 'EN' ? cat.name : (cat.nameSi || cat.name)}</span>
                  <span className="text-[10px] opacity-75 bg-black/10 px-1 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Cards Grid */}
        <div className="px-3 mt-4 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white/80 border border-sky-100 p-6 shadow-xs">
              <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No dishes found</p>
              <p className="text-xs text-slate-500 mt-1">Try another search term or category filter.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const inCart = cart.find(i => i.product.id === product.id);

              return (
                <div 
                  key={product.id}
                  className="rounded-2xl p-3 border border-sky-100 bg-white/95 backdrop-blur-sm flex gap-3 shadow-xs hover:border-sky-300 transition-all"
                >
                  {/* Dish Image */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-sky-100">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.isSpicy && (
                      <span className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/90 text-white text-[10px] shadow-2xs">
                        <Flame className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-bold leading-snug text-slate-900">
                          {language === 'EN' ? product.name : (product.nameSi || product.name)}
                        </h3>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {language === 'EN' ? product.description : (product.descriptionSi || product.description)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-sky-100">
                      <div>
                        <span className="text-xs font-mono font-bold text-pink-600">
                          {product.currency} {product.price.toLocaleString()}
                        </span>
                        {product.preparationTime && (
                          <span className="text-[10px] text-slate-400 block">
                            ⏱ {product.preparationTime}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      {inCart ? (
                        <div className="flex items-center gap-2 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200">
                          <button 
                            onClick={() => removeFromCart(product.id)}
                            className="text-rose-600 hover:text-rose-700 p-0.5"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black text-slate-900 px-1">
                            {inCart.quantity}
                          </span>
                          <button 
                            onClick={() => addToCart(product)}
                            className="text-emerald-600 hover:text-emerald-700 p-0.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-transform active:scale-95 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Bar: Waiter Call & Cart Status */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-sky-100 p-3 shadow-lg">
        <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-between gap-3">
          
          {/* Call Waiter (Only for Dine-in) */}
          {orderMode === 'DINE_IN' && (
            <button
              onClick={() => setIsWaiterModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-xs font-bold text-slate-800 shadow-2xs transition-all"
            >
              <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
              <span>Call Waiter</span>
            </button>
          )}

          {/* Cart Bar Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md transition-transform active:scale-98"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>
                {cartItemCount} {cartItemCount === 1 ? 'Dish' : 'Dishes'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-white">
              <span>View Cart & Pay</span>
              <span className="bg-black/20 px-2 py-0.5 rounded-md font-mono font-bold">
                {tenant.currency} {cartGrandTotal.toLocaleString()}
              </span>
            </div>
          </button>
        </div>
      </footer>

      {/* CART DRAWER MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-sky-100 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-pink-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Your Order Cart ({cartItemCount})
                </h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Your cart is empty. Add items from the digital menu to order.
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/50 border border-sky-100">
                    <div className="flex items-center gap-2.5">
                      <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-sky-100" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</div>
                        <div className="text-[11px] text-pink-600 font-mono font-bold">
                          {product.currency} {(product.price * quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => removeFromCart(product.id)}
                        className="w-6 h-6 rounded bg-white border border-sky-200 text-slate-700 hover:bg-sky-50 flex items-center justify-center text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-slate-900">{quantity}</span>
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-6 h-6 rounded bg-white border border-sky-200 text-slate-700 hover:bg-sky-50 flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary & Checkout Button */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-sky-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-medium text-slate-800">{tenant.currency} {cartSubtotal.toLocaleString()}</span>
                </div>
                {orderMode === 'DELIVERY' && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Delivery Fee:</span>
                    <span className="font-medium text-slate-800">{tenant.currency} {deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Taxes & Service (10%):</span>
                  <span className="font-medium text-slate-800">{tenant.currency} {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-sky-100">
                  <span>Total Amount:</span>
                  <span className="text-pink-600 font-mono font-bold">{tenant.currency} {cartGrandTotal.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Payment Gateway</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CARD PAYMENT GATEWAY & CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Secure Checkout & Payment
                </h2>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="py-4 space-y-4">
              {/* Customer Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#008BB8] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Phone (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#008BB8] shadow-2xs"
                  />
                </div>
              </div>

              {/* Delivery Address if Remote */}
              {orderMode === 'DELIVERY' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#008BB8] shadow-2xs"
                    placeholder="Enter street, building, apartment number"
                  />
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-2xs'
                        : 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-pink-600" />
                    <span>Card Gateway</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                        : 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
                    }`}
                  >
                    <Utensils className="w-4 h-4 text-emerald-600" />
                    <span>{orderMode === 'DINE_IN' ? 'Pay at Table' : 'Cash on Delivery'}</span>
                  </button>
                </div>
              </div>

              {/* Card Gateway Fields */}
              {paymentMethod === 'CARD' && (
                <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-800 font-semibold">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>256-Bit SSL Encrypted</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Test Cards Active
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessingPayment}
                className={`w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all ${
                  isProcessingPayment ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing Payment with Bank...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Order ({tenant.currency} {cartGrandTotal.toLocaleString()})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PWA INSTALL PROMPT MODAL */}
      {isPwaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-amber-500 mx-auto flex items-center justify-center text-white mb-4 shadow-md">
              <Smartphone className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Download {tenant.name} App
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Install our high-performance Progressive Web App directly on your iOS or Android home screen for instant contactless ordering and order tracking.
            </p>

            {pwaInstalled ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Installed on Home Screen!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setPwaInstalled(true);
                    setTimeout(() => setIsPwaModalOpen(false), 1500);
                  }}
                  className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Web App Now</span>
                </button>
                <p className="text-[10px] text-slate-400">
                  On Safari: Tap 'Share' → 'Add to Home Screen'
                </p>
              </div>
            )}

            <button 
              onClick={() => setIsPwaModalOpen(false)}
              className="mt-4 text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CALL WAITER MODAL */}
      {isWaiterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-xs p-5 text-center shadow-2xl">
            <Bell className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-bounce" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Table #{tableNumber} Service
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Instantly notify staff assigned to your table.
            </p>

            {waiterFeedback ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                ✓ {waiterFeedback} Sent!
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleTriggerWaiterCall('CALL_WAITER', 'Waiter Call')}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-800 border border-sky-200 text-xs font-bold transition-colors"
                >
                  🛎 Call Table Waiter
                </button>
                <button
                  onClick={() => handleTriggerWaiterCall('REQUEST_BILL', 'Bill Request')}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-800 border border-sky-200 text-xs font-bold transition-colors"
                >
                  💳 Bring Bill / Payment
                </button>
                <button
                  onClick={() => handleTriggerWaiterCall('WATER_REFILL', 'Water Refill')}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-800 border border-sky-200 text-xs font-bold transition-colors"
                >
                  💧 Water Refill
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsWaiterModalOpen(false)}
              className="mt-4 text-xs text-slate-400 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* GUEST WIFI MODAL */}
      {isWifiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-xs p-5 text-center shadow-2xl">
            <Wifi className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">Guest WiFi Access</h3>
            <p className="text-xs text-slate-500 mb-4">Connect to high speed dining internet.</p>

            <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100 text-left text-xs space-y-1 mb-4">
              <div className="text-slate-500">Network: <strong className="text-slate-900">{tenant.wifiSsid}</strong></div>
              <div className="text-slate-500">Password: <strong className="text-pink-600 font-mono font-bold">{tenant.wifiPassword}</strong></div>
            </div>

            <button
              onClick={() => setIsWifiModalOpen(false)}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
