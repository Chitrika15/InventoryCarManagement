import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Printer,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Truck,
  CheckCheck,
  XCircle,
  Wrench,
  MapPin,
  Calendar,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Order, OrderStatus } from '../../types/index.js';
import { formatCurrency, formatDate } from '../../lib/utils.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Skeleton } from '../../components/ui/Skeleton.js';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-44 rounded-2xl" />
        <Skeleton className="w-full h-72 rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="text-center py-20 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 space-y-4">
        <p className="text-rose-500 font-bold">Failed to load order details</p>
        <Link to="/orders">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Orders
          </Button>
        </Link>
      </div>
    );
  }

  const timelineSteps: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { status: 'PENDING', label: 'Order Placed', icon: <Clock className="w-4 h-4" /> },
    { status: 'PROCESSING', label: 'Processing & Packed', icon: <Package className="w-4 h-4" /> },
    { status: 'SHIPPED', label: 'Shipped & In Transit', icon: <Truck className="w-4 h-4" /> },
    { status: 'DELIVERED', label: 'Delivered', icon: <CheckCheck className="w-4 h-4" /> },
  ];

  const getStepState = (stepStatus: OrderStatus) => {
    if (order.status === 'CANCELLED') {
      return stepStatus === 'PENDING' ? 'completed' : 'cancelled';
    }

    const orderHierarchy = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = orderHierarchy.indexOf(order.status);
    const stepIndex = orderHierarchy.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="space-y-8">
      {/* Top Bar with back link and Print action */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/orders"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>

        <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
          <Printer className="w-4 h-4" />
          Print Tax Invoice
        </Button>
      </div>

      {/* Status Timeline Card (Screen View) */}
      <Card className="p-6 sm:p-8 border-slate-200 dark:border-navy-800 no-print space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-accent-500 uppercase tracking-wider">
              Order Status Tracking
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Order #{order.orderNumber}
            </h2>
          </div>
          <Badge
            variant={
              order.status === 'DELIVERED'
                ? 'success'
                : order.status === 'CANCELLED'
                ? 'danger'
                : order.status === 'SHIPPED'
                ? 'primary'
                : 'default'
            }
          >
            {order.status}
          </Badge>
        </div>

        {/* Timeline Horizontal Stepper */}
        {order.status === 'CANCELLED' ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">This order has been cancelled</p>
              <p className="text-xs opacity-90 mt-0.5">
                All order accessories were restocked to warehouse inventory.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {timelineSteps.map((step) => {
              const state = getStepState(step.status);
              return (
                <div key={step.status} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      state === 'completed'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : state === 'active'
                        ? 'bg-accent-500 text-white ring-4 ring-accent-500/20 animate-pulse'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-400'
                    }`}
                  >
                    {state === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      state === 'completed' || state === 'active'
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Status History Log */}
        <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Activity Log</h4>
          <div className="space-y-2">
            {order.statusHistory.map((hist, idx) => (
              <div
                key={idx}
                className="text-xs flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-navy-900/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{hist.status}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{hist.note || 'Status updated'}</span>
                </div>
                <span className="text-[11px] text-slate-400">{formatDate(hist.at)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Printable Invoice Container (Visible on screen and print formatted) */}
      <div className="printable-area bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xl p-8 sm:p-12 space-y-8">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 border-b border-slate-200 dark:border-navy-800 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent-500 flex items-center justify-center text-white font-black">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                StockDrive <span className="text-accent-500">IMS</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">Official Auto Accessories & Performance Parts</p>
            <p className="text-xs text-slate-500">GSTIN: 29AABCU9603R1ZX</p>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-navy-800 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
              TAX INVOICE
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              Invoice #{order.orderNumber}
            </p>
            <p className="text-xs text-slate-500">Date: {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-2 text-xs">
          <div>
            <h5 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed & Shipped To:</h5>
            <p className="font-bold text-sm text-slate-900 dark:text-white">
              {order.shippingAddress.fullName}
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              {order.shippingAddress.addressLine1}
            </p>
            {order.shippingAddress.addressLine2 && (
              <p className="text-slate-600 dark:text-slate-300">
                {order.shippingAddress.addressLine2}
              </p>
            )}
            <p className="text-slate-600 dark:text-slate-300">
              {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
              {order.shippingAddress.postalCode}
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              Phone: {order.shippingAddress.phone}
            </p>
          </div>

          <div className="sm:text-right">
            <h5 className="font-bold text-slate-400 uppercase tracking-wider mb-2">
              Dispatch Warehouse Details:
            </h5>
            <p className="font-bold text-slate-900 dark:text-white">StockDrive Central Fulfillment</p>
            <p className="text-slate-600 dark:text-slate-300">Hub 4B, Industrial Ring Road</p>
            <p className="text-slate-600 dark:text-slate-300">Bengaluru, Karnataka - 560100</p>
            <p className="text-slate-600 dark:text-slate-300 mt-1">contact@stockdrive.com</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-850">
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">#</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">SKU</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Item Description</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Unit Price</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Qty</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{index + 1}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {item.sku}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Total Calculation */}
        {(() => {
          const subtotal =
            order.items && order.items.length > 0
              ? order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
              : order.totalAmount;
          const gstAmount = Math.round(subtotal * 0.18);
          const grandTotal = subtotal + gstAmount;

          return (
            <div className="pt-4 border-t border-slate-200 dark:border-navy-800 flex justify-end">
              <div className="w-72 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Shipping Fee:</span>
                  <span className="font-semibold text-emerald-500">FREE</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Integrated GST (18%):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(gstAmount)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-navy-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="text-accent-500 text-base">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Terms and signature */}
        <div className="pt-8 border-t border-slate-100 dark:border-navy-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>This is a computer generated invoice and requires no physical signature.</p>
          <div className="text-right">
            <p className="font-bold text-slate-700 dark:text-slate-300">For StockDrive IMS Technologies</p>
            <p className="text-[10px] text-slate-400">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};
