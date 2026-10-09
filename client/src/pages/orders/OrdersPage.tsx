import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Calendar,
  Clock,
  Printer,
  ChevronRight,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Order, OrderStatus } from '../../types/index.js';
import { formatCurrency, formatDate } from '../../lib/utils.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { Modal } from '../../components/ui/Modal.js';
import { useToast } from '../../components/ui/Toast.js';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['my-orders', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus ? `/orders?status=${selectedStatus}` : '/orders';
      const res = await api.get(url);
      return { orders: res.data.data };
    },
  });

  const orders = data?.orders || [];

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post(`/orders/${orderId}/cancel`);
      return res.data.data;
    },
    onSuccess: (updatedOrder) => {
      success(`Order #${updatedOrder.orderNumber} was cancelled and inventory was restocked.`);
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setCancelModalOrder(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Failed to cancel order.';
      showError(msg);
    },
  });

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Order History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track real-time shipment status, view past receipts, and download tax invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-36 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-800 mx-auto flex items-center justify-center text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No orders found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You don't have any orders matching this filter yet. Check back after checkout.
          </p>
          <Link to="/">
            <Button variant="primary" size="sm">
              Shop Accessories
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canCancel = order.status === 'PENDING' || order.status === 'PROCESSING';

            return (
              <Card
                key={order._id}
                className="p-6 border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-navy-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(order.createdAt)}
                      </span>
                      <span>•</span>
                      <span>{order.items.length} items</span>
                    </div>
                  </div>

                  <div className="text-right flex items-center sm:flex-col sm:items-end gap-2 justify-between w-full sm:w-auto">
                    <span className="text-xs text-slate-400 sm:block hidden">Total (incl. 18% GST)</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {(() => {
                        const subtotal =
                          order.items && order.items.length > 0
                            ? order.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)
                            : order.totalAmount;
                        return formatCurrency(subtotal + Math.round(subtotal * 0.18));
                      })()}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="py-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.quantity}x
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">({item.sku})</span>
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent-500" />
                    <span>
                      Latest status:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {order.statusHistory[order.statusHistory.length - 1]?.note || order.status}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCancel && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setCancelModalOrder(order)}
                        className="text-xs"
                      >
                        Cancel Order
                      </Button>
                    )}
                    <Link to={`/orders/${order._id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Timeline & Invoice <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOrder && (
        <Modal
          isOpen={!!cancelModalOrder}
          onClose={() => setCancelModalOrder(null)}
          title={`Cancel Order #${cancelModalOrder.orderNumber}`}
          description="Are you sure you want to cancel this order?"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <span>
                Cancelling this order will automatically restock all{' '}
                {cancelModalOrder.items.reduce((a, b) => a + b.quantity, 0)} reserved accessory items
                back into the active warehouse inventory.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOrder(null)}
                disabled={cancelMutation.isPending}
              >
                Keep Order
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelMutation.mutate(cancelModalOrder._id)}
                isLoading={cancelMutation.isPending}
              >
                Confirm Cancellation & Restock
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
