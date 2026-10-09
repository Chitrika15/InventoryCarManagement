import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Package,
  Download,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { api } from '../../lib/api.js';
import { DashboardKPIs, RevenuePoint, TopSellerItem, CategoryStockValue } from '../../types/index.js';
import { formatCurrency } from '../../lib/utils.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Skeleton } from '../../components/ui/Skeleton.js';

export const AdminDashboardPage: React.FC = () => {
  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery<DashboardKPIs>({
    queryKey: ['admin-kpis'],
    queryFn: async () => {
      const res = await api.get('/reports/kpis');
      return res.data.data;
    },
  });

  // Fetch Revenue chart data
  const { data: revenueData = [], isLoading: revenueLoading } = useQuery<RevenuePoint[]>({
    queryKey: ['admin-revenue-chart'],
    queryFn: async () => {
      const res = await api.get('/reports/revenue?days=30');
      return res.data.data;
    },
  });

  // Fetch Top sellers
  const { data: topSellers = [], isLoading: sellersLoading } = useQuery<TopSellerItem[]>({
    queryKey: ['admin-top-sellers'],
    queryFn: async () => {
      const res = await api.get('/reports/top-sellers?limit=5');
      return res.data.data;
    },
  });

  // Fetch Category stock values
  const { data: categoryData = [], isLoading: catLoading } = useQuery<CategoryStockValue[]>({
    queryKey: ['admin-category-stock'],
    queryFn: async () => {
      const res = await api.get('/reports/category-stock');
      return res.data.data;
    },
  });

  const formattedRevenue = revenueData.map((d) => ({
    date: d.date.slice(5), // MM-DD
    revenue: d.revenue / 100, // in Rupees for clean chart axis
    orders: d.ordersCount,
  }));

  const chartColors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time accessories inventory metrics, revenue charts, and operational alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/reports">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Export CSV Reports
            </Button>
          </Link>
          <Link to="/admin/stock">
            <Button variant="primary" size="sm" className="gap-2">
              <Boxes className="w-4 h-4" /> Manage Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <Card className="p-5 border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {kpisLoading ? (
              <Skeleton className="w-28 h-8" />
            ) : (
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(kpis?.totalRevenue || 0)}
              </h3>
            )}
            <p className="text-xs text-emerald-500 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Gross sales excluding cancelled orders
            </p>
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="p-5 border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {kpisLoading ? (
              <Skeleton className="w-20 h-8" />
            ) : (
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis?.totalOrders || 0}
              </h3>
            )}
            <p className="text-xs text-slate-400 font-medium mt-1">
              Fulfillment lifecycle orders processed
            </p>
          </div>
        </Card>

        {/* Units Sold */}
        <Card className="p-5 border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Units Dispatched
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {kpisLoading ? (
              <Skeleton className="w-20 h-8" />
            ) : (
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis?.unitsSold || 0} pcs
              </h3>
            )}
            <p className="text-xs text-slate-400 font-medium mt-1">Total accessories sold</p>
          </div>
        </Card>

        {/* Low Stock Alert Count */}
        <Card className="p-5 border-slate-200 dark:border-navy-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {kpisLoading ? (
              <Skeleton className="w-16 h-8" />
            ) : (
              <h3 className="text-2xl font-black text-amber-500">
                {kpis?.lowStockCount || 0}
              </h3>
            )}
            <Link
              to="/admin/stock"
              className="text-xs font-bold text-accent-500 hover:text-accent-600 mt-1 inline-flex items-center gap-1"
            >
              Action reorders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Over Time (Area Chart) */}
        <Card className="lg:col-span-2 p-6 border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Revenue Trajectory (Last 30 Days)
              </h3>
              <p className="text-xs text-slate-400">
                Daily sales trends aggregated via MongoDB pipelines
              </p>
            </div>
            <span className="text-xs font-bold text-accent-500 bg-accent-500/10 px-2.5 py-1 rounded-full">
              INR (₹)
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            {revenueLoading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : formattedRevenue.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No orders recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #1e293b',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Top Selling Accessories */}
        <Card className="p-6 border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Top Sellers</h3>
              <p className="text-xs text-slate-400">Highest volume accessories</p>
            </div>
            <Link to="/admin/products" className="text-xs font-bold text-accent-500 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {sellersLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-12 rounded-xl" />
              ))
            ) : topSellers.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No sales recorded yet</p>
            ) : (
              topSellers.map((seller, idx) => (
                <div
                  key={seller.sku}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-6 h-6 rounded-lg bg-accent-500/10 text-accent-500 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {seller.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">{seller.sku}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {seller.unitsSold} sold
                    </span>
                    <p className="text-[10px] text-slate-400">{formatCurrency(seller.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Stock Value by Category Bar Chart */}
      <Card className="p-6 border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Inventory Value by Product Category
            </h3>
            <p className="text-xs text-slate-400">
              Total wholesale and retail valuation across active product categories
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Total Inventory:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {formatCurrency(kpis?.totalInventoryValue || 0)}
            </strong>
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          {catLoading ? (
            <Skeleton className="w-full h-full rounded-2xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData.map((c) => ({
                  category: c.categoryName,
                  value: c.totalStockValue / 100, // Rupees
                  units: c.totalStockUnits,
                }))}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <XAxis
                  dataKey="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Stock Retail Value']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};
