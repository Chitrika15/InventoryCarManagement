import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Order, OrderStatus } from '../../types/index.js';
import { formatCurrency, formatDate } from '../../lib/utils.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useToast } from '../../components/ui/Toast.js';

export const AdminOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Order for Detail Drawer / Modal
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState<OrderStatus>('PROCESSING');
  const [statusNote, setStatusNote] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Fetch Orders
  const { data: ordersData, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['admin-orders', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');

      const res = await api.get(`/orders?${params.toString()}`);
      return { orders: res.data.data };
    },
  });

  const orders = ordersData?.orders || [];

  // Mutation for Status Update
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      note,
    }: {
      orderId: string;
      status: OrderStatus;
      note?: string;
    }) => {
      const res = await api.patch(`/orders/${orderId}/status`, { status, note });
      return res.data.data;
    },
    onSuccess: (updated) => {
      success(
        `Order #${updated.orderNumber} status changed to ${updated.status}${
          updated.status === 'CANCELLED' ? ' (Items restocked to inventory)' : ''
        }`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stock-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['admin-kpis'] });
      setIsStatusModalOpen(false);
      if (activeOrder && activeOrder._id === updated._id) {
        setActiveOrder(updated);
      }
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update order status');
    },
  });

  const openStatusChange = (order: Order) => {
    setActiveOrder(order);
    setNewStatus(order.status);
    setStatusNote('');
    setIsStatusModalOpen(true);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="success">DELIVERED</Badge>;
      case 'SHIPPED':
        return <Badge variant="primary">SHIPPED</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning">PROCESSING</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">CANCELLED</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="default">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Orders Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch verification, live order status transitions, and automated cancellation restocking
          </p>
        </div>

        <Button
          onClick={() => window.open('/api/v1/reports/export/orders', '_blank')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Orders CSV
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-slate-200 dark:border-navy-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search order number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-850">
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Order #</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Customer</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Date</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Items</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Total</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <Skeleton className="w-full h-8 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No matching customer orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/70 dark:hover:bg-navy-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {o.orderNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="truncate max-w-[160px]">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {o.customer?.name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {o.customer?.email}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {o.items.length} pcs
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      {(() => {
                        const subtotal =
                          o.items && o.items.length > 0
                            ? o.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)
                            : o.totalAmount;
                        return formatCurrency(subtotal + Math.round(subtotal * 0.18));
                      })()}
                    </td>

                    <td className="py-3.5 px-4 text-center">{getStatusBadge(o.status)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveOrder(o)}
                          className="h-7 text-xs px-2.5"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openStatusChange(o)}
                          className="h-7 text-xs px-2.5"
                        >
                          Update Status
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Drawer / Modal */}
      {activeOrder && !isStatusModalOpen && (
        <Modal
          isOpen={!!activeOrder}
          onClose={() => setActiveOrder(null)}
          title={`Order #${activeOrder.orderNumber}`}
          description={`Placed by ${activeOrder.customer?.name} (${activeOrder.customer?.email})`}
          maxWidth="lg"
        >
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60">
              <span className="text-xs font-semibold text-slate-500">Current Lifecycle Status:</span>
              {getStatusBadge(activeOrder.status)}
            </div>

            {/* Purchased Items */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase text-slate-400">Purchased Items</h5>
              <div className="divide-y divide-slate-100 dark:divide-navy-800 max-h-48 overflow-y-auto">
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {item.sku} • {item.quantity} units @ {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60 text-xs space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px] block">
                Shipping Destination:
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {activeOrder.shippingAddress.fullName}
              </p>
              <p className="text-slate-500">
                {activeOrder.shippingAddress.addressLine1}, {activeOrder.shippingAddress.city},{' '}
                {activeOrder.shippingAddress.state} - {activeOrder.shippingAddress.postalCode}
              </p>
              <p className="text-slate-500">Phone: {activeOrder.shippingAddress.phone}</p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-navy-800">
              <a
                href={`/orders/${activeOrder._id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent-500 font-bold hover:underline inline-flex items-center gap-1"
              >
                Open Tax Invoice <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveOrder(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    openStatusChange(activeOrder);
                  }}
                >
                  Change Status
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Transition Modal */}
      {isStatusModalOpen && activeOrder && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Update Status: Order #${activeOrder.orderNumber}`}
          description="Transition status or cancel order with automatic warehouse restock"
          maxWidth="md"
        >
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                New Order Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
              >
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED (Triggers Automatic Restock)</option>
              </select>
            </div>

            {newStatus === 'CANCELLED' && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Restock Notice:</strong> Selecting CANCELLED will immediately return all{' '}
                  {activeOrder.items.reduce((a, b) => a + b.quantity, 0)} reserved units back into
                  active inventory and generate StockMovement IN ledger entries.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Status Update Note (Optional)
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Package dispatched with tracking AW-8921"
                className="w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStatusModalOpen(false)}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={newStatus === 'CANCELLED' ? 'destructive' : 'primary'}
                size="sm"
                onClick={() =>
                  updateStatusMutation.mutate({
                    orderId: activeOrder._id,
                    status: newStatus,
                    note: statusNote,
                  })
                }
                isLoading={updateStatusMutation.isPending}
              >
                Confirm Status Transition
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
