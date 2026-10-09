import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  AlertTriangle,
  Download,
  Calendar,
  User as UserIcon,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { StockMovement, Product } from '../../types/index.js';
import { formatDate, formatCurrency } from '../../lib/utils.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../components/ui/Toast.js';

const adjustSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(3, 'A clear reason is mandatory for auditing').max(500),
});

type AdjustFormData = z.infer<typeof adjustSchema>;

export const AdminStockPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<'ledger' | 'alerts'>('ledger');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);

  // Filters for ledger
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Fetch low stock alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Product[]>({
    queryKey: ['admin-low-stock-alerts'],
    queryFn: async () => {
      const res = await api.get('/stock/alerts');
      return res.data.data;
    },
  });

  // Fetch stock ledger
  const { data: ledger = [], isLoading: ledgerLoading } = useQuery<StockMovement[]>({
    queryKey: ['admin-stock-ledger', typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      params.append('limit', '50');

      const res = await api.get(`/stock/ledger?${params.toString()}`);
      return res.data.data;
    },
  });

  // Fetch all products for selector dropdown
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['admin-all-products-for-adjust'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data.data;
    },
  });

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      productId: '',
      type: 'IN',
      quantity: 5,
      reason: '',
    },
  });

  const selectedType = watch('type');

  const openAdjustModalWithProduct = (product: Product, type: 'IN' | 'OUT' | 'ADJUSTMENT' = 'IN') => {
    setValue('productId', product._id);
    setValue('type', type);
    setValue('quantity', 10);
    setValue('reason', type === 'IN' ? 'Restocking shipment received from supplier' : '');
    setSelectedProductForRestock(product);
    setIsAdjustModalOpen(true);
  };

  const onAdjustSubmit = async (data: AdjustFormData) => {
    try {
      await api.post('/stock/adjust', data);
      success(`Stock adjustment recorded successfully!`);
      setIsAdjustModalOpen(false);
      reset();
      setSelectedProductForRestock(null);

      // Invalidate queries to refresh data across all views
      queryClient.invalidateQueries({ queryKey: ['admin-stock-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['admin-low-stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-kpis'] });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to adjust stock.';
      showError(msg);
    }
  };

  const handleDownloadLedgerCSV = () => {
    window.open('/api/v1/reports/export/stock', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Stock Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit inventory movements, record warehouse intake/outflow with mandatory reasons, and
            monitor low-stock warnings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadLedgerCSV} variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Ledger CSV
          </Button>
          <Button
            onClick={() => {
              reset({
                productId: allProducts[0]?._id || '',
                type: 'IN',
                quantity: 10,
                reason: '',
              });
              setSelectedProductForRestock(null);
              setIsAdjustModalOpen(true);
            }}
            variant="primary"
            className="gap-2"
          >
            <Boxes className="w-4 h-4" /> Record Movement / Adjustment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-navy-800 pb-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-accent-500 text-white shadow-md shadow-accent-500/25'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Boxes className="w-4 h-4" /> Movement Ledger ({ledger.length})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Low Stock Alerts ({alerts.length})
        </button>
      </div>

      {/* Tab 1: Stock Movement Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <Card className="p-4 border-slate-200 dark:border-navy-800 flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Movement Ledger Filter</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
            >
              <option value="">All Movement Types</option>
              <option value="IN">Stock IN (Intake)</option>
              <option value="OUT">Stock OUT (Dispatched)</option>
              <option value="ADJUSTMENT">Stock ADJUSTMENT (Physical Count)</option>
            </select>
          </Card>

          <Card className="overflow-hidden border-slate-200 dark:border-navy-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-850">
                    <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Timestamp</th>
                    <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Product</th>
                    <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Type</th>
                    <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Delta</th>
                    <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Stock Path</th>
                    <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Audited Reason</th>
                    <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {ledgerLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="p-4">
                          <Skeleton className="w-full h-8 rounded-lg" />
                        </td>
                      </tr>
                    ))
                  ) : ledger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No stock movement logs found.
                      </td>
                    </tr>
                  ) : (
                    ledger.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/70 dark:hover:bg-navy-800/40">
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formatDate(m.createdAt)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="truncate max-w-xs">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {m.product?.name || 'Deleted Product'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {m.product?.sku}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {m.type === 'IN' && (
                            <Badge variant="success" className="gap-1">
                              <ArrowUpRight className="w-3 h-3" /> IN
                            </Badge>
                          )}
                          {m.type === 'OUT' && (
                            <Badge variant="danger" className="gap-1">
                              <ArrowDownRight className="w-3 h-3" /> OUT
                            </Badge>
                          )}
                          {m.type === 'ADJUSTMENT' && (
                            <Badge variant="primary" className="gap-1">
                              <Sliders className="w-3 h-3" /> ADJUST
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold">
                          <span
                            className={
                              m.type === 'IN'
                                ? 'text-emerald-500'
                                : m.type === 'OUT'
                                ? 'text-rose-500'
                                : 'text-blue-500'
                            }
                          >
                            {m.type === 'IN' ? `+${m.quantity}` : m.type === 'OUT' ? `-${m.quantity}` : `Δ ${m.quantity}`}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-500">
                          <span>{m.previousStock}</span>
                          <span className="mx-1.5 text-slate-400">➔</span>
                          <strong className="text-slate-900 dark:text-white">{m.newStock}</strong>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {m.reason}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                            {m.createdBy?.name || 'System'}
                          </span>
                          <span className="text-[10px] text-slate-400">{m.createdBy?.role}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Low-Stock Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              The following products have warehouse stock below or equal to their threshold level:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api/v1/reports/export/low-stock', '_blank')}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Low-Stock CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))
            ) : alerts.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800">
                <Boxes className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 dark:text-white">Inventory Healthy</h4>
                <p className="text-xs text-slate-400">All products are stocked above reorder levels.</p>
              </div>
            ) : (
              alerts.map((prod) => (
                <Card
                  key={prod._id}
                  className="p-5 border-amber-500/30 bg-amber-500/5 dark:bg-navy-900 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-500">{prod.sku}</span>
                      <Badge variant={prod.stock === 0 ? 'danger' : 'warning'}>
                        {prod.stock === 0 ? 'OUT OF STOCK' : `CRITICAL (${prod.stock} left)`}
                      </Badge>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {prod.name}
                    </h4>

                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span>Threshold: {prod.reorderLevel} units</span>
                      <span>Deficit: {Math.max(0, prod.reorderLevel - prod.stock)} units</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => openAdjustModalWithProduct(prod, 'IN')}
                    className="w-full gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Restock IN Now
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Record Stock Movement & Ledger Entry"
        description="Every movement requires a mandatory audit reason and validates boundary bounds"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onAdjustSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Select Product
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
              {...register('productId')}
            >
              <option value="">-- Choose Product --</option>
              {allProducts.map((p) => (
                <option key={p._id} value={p._id}>
                  [{p.sku}] {p.name} (Current Stock: {p.stock})
                </option>
              ))}
            </select>
            {errors.productId && (
              <p className="text-xs text-rose-500 mt-1">{errors.productId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Movement Type
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
                {...register('type')}
              >
                <option value="IN">Stock IN (Receive new supply)</option>
                <option value="OUT">Stock OUT (Damaged / Return)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Count discrepancy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                {selectedType === 'ADJUSTMENT' ? 'New Target Stock Count' : 'Quantity Delta'}
              </label>
              <Input
                type="number"
                min="0"
                placeholder="10"
                error={errors.quantity?.message}
                {...register('quantity')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Mandatory Reason (Audited Ledger)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Received shipment from Michelin supplier PO-8921, or damaged battery terminal write-off"
              className="w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-xs text-rose-500 mt-1">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdjustModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Apply & Save to Ledger
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
