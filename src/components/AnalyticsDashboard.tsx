import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Eye, 
  ShoppingBag, 
  Calendar, 
  Building2, 
  ArrowUpRight, 
  Sparkles, 
  Clock, 
  UtensilsCrossed, 
  DollarSign, 
  Percent,
  CheckCircle2,
  Filter,
  BarChart3
} from 'lucide-react';
import { Tenant } from '../types';

interface AnalyticsDashboardProps {
  tenants: Tenant[];
  currentTenantId: string;
  onSelectTenant: (id: string) => void;
  onNavigateToDashboard?: (tenantId: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  tenants,
  currentTenantId,
  onSelectTenant,
  onNavigateToDashboard,
}) => {
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>(currentTenantId || 'ALL');
  const [timeRange, setTimeRange] = useState<'14D' | '7D'>('14D');

  // Determine current active tenant or aggregate
  const isAll = selectedTenantFilter === 'ALL';
  const selectedTenant = tenants.find(t => t.id === selectedTenantFilter) || tenants[0];

  // Aggregate or single tenant daily data
  const baseTrends = isAll 
    ? (tenants[0]?.dailyTrends || []).map((day, idx) => {
        let totalViews = 0;
        let totalOrders = 0;
        let totalRevenue = 0;
        tenants.forEach(t => {
          if (t.dailyTrends && t.dailyTrends[idx]) {
            totalViews += t.dailyTrends[idx].views;
            totalOrders += t.dailyTrends[idx].orders;
            totalRevenue += t.dailyTrends[idx].revenue;
          }
        });
        return {
          date: day.date,
          dayName: day.dayName,
          views: totalViews,
          orders: totalOrders,
          revenue: totalRevenue,
          conversionRate: totalViews > 0 ? Number(((totalOrders / totalViews) * 100).toFixed(1)) : 0,
        };
      })
    : (selectedTenant?.dailyTrends || []).map(d => ({
        ...d,
        conversionRate: d.views > 0 ? Number(((d.orders / d.views) * 100).toFixed(1)) : 0,
      }));

  const chartData = timeRange === '7D' ? baseTrends.slice(-7) : baseTrends;

  // Total KPIs
  const totalViews = isAll 
    ? tenants.reduce((acc, t) => acc + t.totalViews, 0)
    : selectedTenant.totalViews;

  const totalOrders = isAll
    ? tenants.reduce((acc, t) => acc + t.totalOrders, 0)
    : selectedTenant.totalOrders;

  const avgConversion = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(1) : '0';

  // Tenant Comparison Data
  const tenantComparisonData = tenants.map(t => ({
    name: t.name.length > 16 ? t.name.substring(0, 14) + '...' : t.name,
    fullName: t.name,
    views: t.totalViews,
    orders: t.totalOrders,
    conversion: t.totalViews > 0 ? Number(((t.totalOrders / t.totalViews) * 100).toFixed(1)) : 0,
    plan: t.plan,
  }));

  // Hourly Peak Scans Simulation Data (Typical Restaurant Scan Hours)
  const hourlyScanData = [
    { hour: '11 AM', scans: 45, orders: 12 },
    { hour: '12 PM', scans: 140, orders: 48 },
    { hour: '1 PM', scans: 220, orders: 85 },
    { hour: '2 PM', scans: 110, orders: 35 },
    { hour: '3 PM', scans: 40, orders: 8 },
    { hour: '4 PM', scans: 30, orders: 6 },
    { hour: '5 PM', scans: 60, orders: 14 },
    { hour: '6 PM', scans: 130, orders: 45 },
    { hour: '7 PM', scans: 280, orders: 115 },
    { hour: '8 PM', scans: 340, orders: 145 },
    { hour: '9 PM', scans: 290, orders: 120 },
    { hour: '10 PM', scans: 110, orders: 38 },
  ];

  // Category Distribution for active tenant
  const categoryData = (selectedTenant?.categories || []).map((cat, idx) => {
    const itemCount = (selectedTenant.products || []).filter(p => p.categoryId === cat.id).length;
    const colors = ['#e11d48', '#0284c7', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899'];
    return {
      name: cat.name,
      value: itemCount > 0 ? itemCount * 180 : 100, // proportional view weight
      color: colors[idx % colors.length],
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-600/30">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Analytics & Engagement Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
                Powered by Recharts
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualizing QR Menu <strong className="text-slate-200">totalViews</strong> and <strong className="text-slate-200">totalOrders</strong> trends across restaurants.
            </p>
          </div>

          {/* Tenant Selector & Time Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Building2 className="w-4 h-4 text-rose-400" />
              <select
                value={selectedTenantFilter}
                onChange={(e) => {
                  setSelectedTenantFilter(e.target.value);
                  if (e.target.value !== 'ALL') {
                    onSelectTenant(e.target.value);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Restaurants (Agency Overview)</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name} ({t.slug}.ceyteq.com)
                  </option>
                ))}
              </select>
            </div>

            {/* Time Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setTimeRange('7D')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timeRange === '7D' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('14D')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timeRange === '14D' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                14 Days
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total QR Menu Views</span>
              <Eye className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {totalViews.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% vs last period</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Orders Placed</span>
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {totalOrders.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+14.2% dine-in orders</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>View-to-Order Conversion</span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {avgConversion}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              High scan intent at tables
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Peak Scanning Rush</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              7 PM - 9 PM
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Dinner service accounts for 58%
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        
        {/* CHART 1: TotalViews & TotalOrders Trend (Area Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                <span>Daily Trends: Total Views vs Total Orders</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAll 
                  ? 'Aggregated across all Ceyteq tenant restaurants' 
                  : `Real-time activity for ${selectedTenant.name}`}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-300">QR Menu Views (totalViews)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-slate-300">Orders Placed (totalOrders)</span>
              </div>
            </div>
          </div>

          {/* Recharts Area Container */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }} 
                  itemStyle={{ padding: '2px 0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  name="QR Menu Views" 
                  stroke="#e11d48" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  name="Orders Placed" 
                  stroke="#38bdf8" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorOrders)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROW 2: Tenant Comparison Bar Chart & Peak Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Tenant Comparison Bar Chart */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>Tenant Performance Comparison</span>
                </h3>
                <p className="text-xs text-slate-400">Total Views and Orders grouped by restaurant</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenantComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  />
                  <Bar dataKey="views" name="Total Views" fill="#e11d48" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="orders" name="Total Orders" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Dining Scan Hours */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Hourly Scan Traffic</span>
                </h3>
                <p className="text-xs text-slate-400">Customer table scans throughout the day</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyScanData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar dataKey="scans" name="Table Scans" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 3: Category Breakdown & Restaurant Owner Action Link */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Category Popularity */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
              <span>Category Engagement for {selectedTenant.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Customer interest distribution across menu sections</p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="h-52 w-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#334155', 
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend List */}
              <div className="flex-1 space-y-2 w-full text-xs">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-200">{cat.name}</span>
                    </div>
                    <span className="font-mono text-slate-400">{cat.value} scans</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Direct Customization Callout (Sri Lankan Context) */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restaurant Admin Customization Access</span>
              </div>

              <h3 className="text-lg font-bold text-white">
                Customize {selectedTenant.name}'s Menu & Pricing
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                (රෙස්ටුරන්ට් එක ඇතුලට ගිහින් මෙනු එක කස්ටම් කරගන්න): 
                As the restaurant admin for <strong>{selectedTenant.name}</strong>, you have full control to add signature dishes, update prices on the fly, upload food photos, toggle out-of-stock items, and print table QR codes.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant Price Updates</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Bilingual Sinhala Names</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>High-Res Table QR Codes</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Custom CNAME Domains</span>
                </div>
              </div>
            </div>

            {onNavigateToDashboard && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Switch directly to this tenant's panel:</span>
                <button
                  onClick={() => onNavigateToDashboard(selectedTenant.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-transform active:scale-95"
                >
                  <span>Open {selectedTenant.name} Panel</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
