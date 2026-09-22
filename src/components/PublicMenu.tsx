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
  Maximize2
} from 'lucide-react';
import { Tenant, Product, CartItem } from '../types';

interface PublicMenuProps {
  tenant: Tenant;
  tableNumber?: number;
  onCallWaiter?: (table: number, type: string) => void;
  onOpenDashboard?: () => void;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({
  tenant,
  tableNumber = 4,
  onCallWaiter,
  onOpenDashboard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'SPICY' | 'HALAL'>('ALL');
  const [language, setLanguage] = useState<'EN' | 'SI'>('EN');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [waiterFeedback, setWaiterFeedback] = useState<string | null>(null);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Icon mapping helper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Fish': return <Fish className="w-4 h-4" />;
      case 'Utensils': return <Utensils className="w-4 h-4" />;
      case 'Coffee': return <Coffee className="w-4 h-4" />;
      case 'IceCream': return <IceCream className="w-4 h-4" />;
      case 'Wine': return <Wine className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  // Filter products
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

  const totalCartPrice = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCallWaiterAction = (type: string, title: string) => {
    if (onCallWaiter) {
      onCallWaiter(tableNumber, type);
    }
    setWaiterFeedback(title);
    setTimeout(() => {
      setWaiterFeedback(null);
      setIsWaiterModalOpen(false);
    }, 2000);
  };

  const handleSendOrder = () => {
    setOrderSuccess(true);
    setTimeout(() => {
      setCart([]);
      setOrderSuccess(false);
      setIsCartOpen(false);
    }, 2200);
  };

  // Format currency
  const formatMoney = (amount: number) => {
    return `${tenant.currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-4 px-2 sm:px-4">
      {/* Top Simulator Control Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Customer View
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="font-mono text-slate-300 hidden sm:inline">
            {tenant.customDomain || `${tenant.subdomain}.ceyteq.com`}/table/{tableNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title={isMobileFrame ? "Switch to Fullscreen" : "Switch to Phone Frame"}
          >
            {isMobileFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand Fullscreen</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone Frame</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container: either simulated iPhone container or fluid container */}
      <div 
        className={`w-full transition-all duration-300 ${
          isMobileFrame 
            ? 'max-w-md bg-slate-950 rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden relative pb-24' 
            : 'max-w-4xl bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden pb-24'
        }`}
      >
        {/* Restaurant Header Cover */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden">
          <img 
            src={tenant.coverImageUrl} 
            alt={tenant.name}
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          {/* Top Bar with Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 shadow text-xs font-semibold text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Table #{tableNumber}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-full border border-slate-700/60 shadow text-xs">
              <button
                onClick={() => setLanguage('EN')}
                className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                  language === 'EN' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('SI')}
                className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                  language === 'SI' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                සිංහල
              </button>
            </div>
          </div>

          {/* Restaurant Avatar & Identity */}
          <div className="absolute -bottom-1 left-4 right-4 flex items-end gap-3 z-10">
            <img 
              src={tenant.logoUrl} 
              alt={tenant.name}
              className="w-16 h-16 rounded-2xl border-2 border-slate-800 object-cover shadow-lg bg-slate-900"
            />
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                {tenant.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Clock className="w-3 h-3" /> Open Now • 11:00 AM - 11:00 PM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Restaurant Actions (WiFi, Address, Call) */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-1 text-slate-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{tenant.address}</span>
          </div>

          {tenant.wifiSsid && (
            <button
              onClick={() => setIsWifiModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shrink-0 transition-colors"
            >
              <Wifi className="w-3 h-3 text-cyan-400" />
              <span>WiFi</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'EN' ? "Search dishes, ingredients, drinks..." : "කෑම වර්ග, බීම සොයන්න..."}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dietary Filters */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setDietaryFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              dietaryFilter === 'ALL' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {language === 'EN' ? 'All' : 'සියල්ල'}
          </button>
          <button
            onClick={() => setDietaryFilter('SPICY')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              dietaryFilter === 'SPICY' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            {language === 'EN' ? 'Spicy 🔥' : 'සැර කෑම'}
          </button>
          <button
            onClick={() => setDietaryFilter('VEG')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              dietaryFilter === 'VEG' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {language === 'EN' ? 'Vegetarian 🌱' : 'එළවළු පමණක්'}
          </button>
          <button
            onClick={() => setDietaryFilter('HALAL')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              dietaryFilter === 'HALAL' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            {language === 'EN' ? 'Halal 🟢' : 'හලාල්'}
          </button>
        </div>

        {/* Category Horizontal Pills */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800/80">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-slate-100 text-slate-950 shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{language === 'EN' ? 'All Dishes' : 'සියලුම කෑම'}</span>
            <span className="text-[10px] opacity-70 ml-0.5">({tenant.products.length})</span>
          </button>

          {tenant.categories.map((category) => {
            const count = tenant.products.filter(p => p.categoryId === category.id).length;
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {getCategoryIcon(category.iconName)}
                <span>{language === 'SI' && category.nameSi ? category.nameSi : category.name}</span>
                <span className="text-[10px] opacity-70 ml-0.5">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Product Cards List */}
        <div className="p-4 space-y-3.5">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Utensils className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No dishes match your filter</p>
              <p className="text-xs text-slate-600 mt-1">Try searching for something else</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const inCart = cart.find(item => item.product.id === product.id);
              return (
                <div
                  key={product.id}
                  className={`bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 flex gap-3.5 relative overflow-hidden transition-all hover:border-slate-700 ${
                    !product.isAvailable ? 'opacity-60' : ''
                  }`}
                >
                  {/* Left: Food Image */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-800">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-1 text-center">
                        <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">Sold Out</span>
                      </div>
                    )}
                    {product.isSpicy && (
                      <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm p-1 rounded-md text-amber-400">
                        <Flame className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Right: Info and Action */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-100 leading-snug">
                          {language === 'SI' && product.nameSi ? product.nameSi : product.name}
                        </h3>
                      </div>
                      
                      {language === 'EN' && product.nameSi && (
                        <p className="text-[11px] text-slate-400 font-normal">{product.nameSi}</p>
                      )}

                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {language === 'SI' && product.descriptionSi ? product.descriptionSi : product.description}
                      </p>
                    </div>

                    {/* Bottom: Price and Stepper */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60">
                      <div>
                        <span className="text-sm font-extrabold text-white">
                          {formatMoney(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-slate-500 line-through ml-1.5">
                            {formatMoney(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      {product.isAvailable ? (
                        inCart ? (
                          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center text-white">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(product)}
                              className="w-6 h-6 rounded bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-transform active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-slate-500 font-medium italic">Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Customer Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex items-center gap-2 z-20">
          {/* Call Waiter button */}
          <button
            onClick={() => setIsWaiterModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold text-xs border border-amber-500/30 transition-all active:scale-98"
          >
            <Bell className="w-4 h-4" />
            <span>{language === 'EN' ? 'Call Waiter' : 'වේටර් අමතන්න'}</span>
          </button>

          {/* Cart / Order button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-white font-semibold text-xs transition-all active:scale-98 shadow-lg ${
              totalCartCount > 0 ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{language === 'EN' ? 'View Order' : 'ඇණවුම බලන්න'}</span>
            {totalCartCount > 0 && (
              <span className="bg-white text-rose-600 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-rose-500" />
                  Table #{tableNumber} Order
                </h2>
                <p className="text-xs text-slate-400">Review items before sending to kitchen</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Order Sent to Kitchen!</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xs">
                  Your food is being prepared. Staff will bring it to Table #{tableNumber} shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Your order is empty</p>
                    </div>
                  ) : (
                    cart.map(({ product, quantity }) => (
                      <div key={product.id} className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{product.name}</h4>
                          <p className="text-xs text-slate-400 font-mono">{formatMoney(product.price)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white w-4 text-center">{quantity}</span>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-6 h-6 rounded bg-rose-600 text-white hover:bg-rose-500 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Total Amount</span>
                      <span className="text-lg font-bold text-white font-mono">{formatMoney(totalCartPrice)}</span>
                    </div>

                    <button
                      onClick={handleSendOrder}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg transition-all active:scale-98"
                    >
                      Send Order to Kitchen • {formatMoney(totalCartPrice)}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Call Waiter Modal */}
      {isWaiterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Call Waiter (Table #{tableNumber})</h3>
              </div>
              <button
                onClick={() => setIsWaiterModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {waiterFeedback ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-pulse" />
                <p className="text-sm font-semibold text-white">{waiterFeedback}</p>
                <p className="text-xs text-slate-400 mt-1">Staff has been notified on the restaurant panel!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  onClick={() => handleCallWaiterAction('CALL_WAITER', 'Staff is on their way!')}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-white flex items-center justify-between"
                >
                  <span>🙋 Need Assistance / Menu Guidance</span>
                  <span className="text-xs text-slate-400">Ping</span>
                </button>

                <button
                  onClick={() => handleCallWaiterAction('REQUEST_BILL', 'Bill requested! Waiter bringing receipt.')}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-white flex items-center justify-between"
                >
                  <span>💳 Request Bill (Cash / Card)</span>
                  <span className="text-xs text-slate-400">Billing</span>
                </button>

                <button
                  onClick={() => handleCallWaiterAction('WATER_REFILL', 'Water refill notified.')}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-white flex items-center justify-between"
                >
                  <span>💧 Complimentary Water Refill</span>
                  <span className="text-xs text-slate-400">Drinks</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest WiFi Modal */}
      {isWifiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Free Guest WiFi</h3>
              </div>
              <button
                onClick={() => setIsWifiModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div>
                <span className="text-xs text-slate-400">Network (SSID)</span>
                <p className="text-sm font-mono font-bold text-white">{tenant.wifiSsid}</p>
              </div>
              {tenant.wifiPassword && (
                <div>
                  <span className="text-xs text-slate-400">Password</span>
                  <p className="text-sm font-mono font-bold text-cyan-400 select-all">{tenant.wifiPassword}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
