import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Download,
  BarChart3,
  TrendingUp,
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { DashboardKPIs, CategoryStockValue } from '../../types/index.js';
import { formatCurrency } from '../../lib/utils.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Skeleton } from '../../components/ui/Skeleton.js';

export const AdminReportsPage: React.FC = () => {
  const { data: kpis, isLoading: kpisLoading } = useQuery<DashboardKPIs>({
    queryKey: ['admin-reports-kpis'],
    queryFn: async () => {
      const res = await api.get('/reports/kpis');
      return res.data.data;
    },
  });

  const { data: categories = [], isLoading: catLoading } = useQuery<CategoryStockValue[]>({
    queryKey: ['admin-reports-categories'],
    queryFn: async () => {
      const res = await api.get('/reports/category-stock');
      return res.data.data;
    },
  });

  const exportCSV = (endpoint: string) => {
    window.open(`/api/v1/reports/export/${endpoint}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Reports & CSV Exports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate enterprise inventory spreadsheets, sales audit dumps, and category asset valuations
        </p>
      </div>

      {/* 3 Dedicated CSV Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orders CSV */}
        <Card className="p-6 border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Customer Orders CSV</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete chronological ledger of all customer transactions, shipping addresses, order
              statuses, and itemized invoice values.
            </p>
          </div>
          <Button
            onClick={() => exportCSV('orders')}
            variant="outline"
            className="w-full gap-2 text-xs"
          >
            <Download className="w-4 h-4" /> Download Orders CSV
          </Button>
        </Card>

        {/* Stock Ledger CSV */}
        <Card className="p-6 border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Stock Movement Ledger</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Full warehouse audit log detailing stock IN, OUT, and physical count ADJUSTMENT events,
              complete with mandatory reasons and user timestamps.
            </p>
          </div>
          <Button
            onClick={() => exportCSV('stock')}
            variant="outline"
            className="w-full gap-2 text-xs"
          >
            <Download className="w-4 h-4" /> Download Stock Ledger CSV
          </Button>
        </Card>

        {/* Low Stock Alert CSV */}
        <Card className="p-6 border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Low-Stock Alert CSV</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deficit report of active accessories with stock at or below reorder threshold. Ideal for
              sending replenishment purchase orders to suppliers.
            </p>
          </div>
          <Button
            onClick={() => exportCSV('low-stock')}
            variant="outline"
            className="w-full gap-2 text-xs"
          >
            <Download className="w-4 h-4" /> Download Low-Stock CSV
          </Button>
        </Card>
      </div>

      {/* Category Asset Valuation Table */}
      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden space-y-4 p-6">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Category Asset & Margin Valuation
          </h3>
          <p className="text-xs text-slate-400">
            Real-time breakdown of warehouse capital allocation, retail revenue potential, and gross
            margins
          </p>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-850">
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Category</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">SKU Count</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Units in Stock</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Cost Value</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Retail Potential</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Est. Gross Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {catLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <Skeleton className="w-full h-8 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No category data available.
                  </td>
                </tr>
              ) : (
                categories.map((c) => {
                  const estProfit = c.totalStockValue - c.totalCostValue;
                  const marginPct =
                    c.totalStockValue > 0
                      ? Math.round((estProfit / c.totalStockValue) * 100)
                      : 0;

                  return (
                    <tr key={c.categoryId} className="hover:bg-slate-50/70 dark:hover:bg-navy-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {c.categoryName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {c.productCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {c.totalStockUnits} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                        {formatCurrency(c.totalCostValue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(c.totalStockValue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-500">
                        +{formatCurrency(estProfit)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">({marginPct}%)</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
