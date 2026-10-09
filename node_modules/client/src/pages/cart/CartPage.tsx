import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { api } from '../../lib/api.js';
import { formatCurrency } from '../../lib/utils.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Modal } from '../../components/ui/Modal.js';
import { useToast } from '../../components/ui/Toast.js';

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Name is required').max(100),
  addressLine1: z.string().min(3, 'Address is required').max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  postalCode: z.string().min(4, 'Postal code is required').max(20),
  phone: z.string().min(8, 'Valid phone number is required').max(20),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, getTotalAmount, getTotalItems } =
    useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = getTotalAmount();
  const totalItems = getTotalItems();
  const subtotal = totalAmount;
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstAmount;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: user?.name || '',
      addressLine1: '402 Apex Horizon Towers, Sector 14',
      addressLine2: 'Near Cyber Gateway',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      phone: '+91 98765 43210',
    },
  });

  const handleProceedToCheckout = () => {
    if (!user) {
      showError('Please sign in or register to proceed to checkout');
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handlePlaceOrder = async (shippingData: ShippingFormData) => {
    setIsSubmitting(true);
    try {
      const orderPayload = {
        items: items.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity,
        })),
        shippingAddress: shippingData,
      };

      const res = await api.post('/orders', orderPayload);
      const createdOrder = res.data.data;

      clearCart();
      setIsCheckoutModalOpen(false);
      success(`Order ${createdOrder.orderNumber} successfully placed!`);
      navigate(`/orders/${createdOrder._id}`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Failed to complete checkout transaction. Please try again.';
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-24 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 space-y-4 max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-navy-800 mx-auto flex items-center justify-center text-slate-400">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          You haven't added any accessories yet. Explore tyres, batteries, infotainment, lighting, and
          detailing kits.
        </p>
        <Link to="/">
          <Button variant="primary" className="mt-2">
            Explore Accessories Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Shopping Cart</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your selected auto parts and accessories before checkout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <Card
              key={product._id}
              className="p-4 flex flex-col sm:flex-row items-center gap-4 border-slate-200 dark:border-navy-800 shadow-sm"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-950 shrink-0">
                <img
                  src={
                    product.imageUrl ||
                    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-bold text-slate-400 uppercase">
                  <span>{product.brand}</span>
                  <span>•</span>
                  <span>{product.sku}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {product.name}
                </h3>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrency(product.price)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Available in warehouse: {product.stock} units
                </div>
              </div>

              {/* Quantity Stepper & Remove */}
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/80 p-1">
                  <button
                    onClick={() => updateQuantity(product._id, quantity - 1)}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-navy-700 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-slate-100">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      const res = updateQuantity(product._id, quantity + 1);
                      if (!res.success) showError(res.message || 'Cannot increase quantity');
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-navy-700 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right sm:w-28">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {formatCurrency(product.price * quantity)}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(product._id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary Card */}
        <Card className="p-6 border-slate-200 dark:border-navy-800 shadow-md space-y-5 sticky top-28">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Order Summary</h2>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Items Subtotal ({totalItems} pcs)</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-semibold text-emerald-500">FREE</span>
            </div>
            <div className="flex justify-between">
              <span>Integrated GST (18%)</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(gstAmount)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-navy-800 flex justify-between text-base font-black text-slate-900 dark:text-white">
              <span>Total Payable</span>
              <span className="text-accent-500">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <Button onClick={handleProceedToCheckout} className="w-full" size="lg">
            Proceed to Checkout
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="pt-2 border-t border-slate-100 dark:border-navy-800/80 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Transactional inventory decrement with atomic rollback safeguard</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Instant order number generation & printable tax invoice</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Checkout Shipping & Payment Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="Complete Checkout & Mock Payment"
        description="Verify delivery details and confirm simulated transaction"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(handlePlaceOrder)} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Recipient Full Name
              </label>
              <Input placeholder="Alex Vance" error={errors.fullName?.message} {...register('fullName')} />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Street Address
              </label>
              <Input
                placeholder="402 Apex Towers, Sector 14"
                error={errors.addressLine1?.message}
                {...register('addressLine1')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Landmark / Suite (Optional)
              </label>
              <Input placeholder="Near Cyber Gateway" {...register('addressLine2')} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                City
              </label>
              <Input placeholder="Bengaluru" error={errors.city?.message} {...register('city')} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                State
              </label>
              <Input placeholder="Karnataka" error={errors.state?.message} {...register('state')} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                PIN / Postal Code
              </label>
              <Input placeholder="560001" error={errors.postalCode?.message} {...register('postalCode')} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Phone Number
              </label>
              <Input placeholder="+91 98765 43210" error={errors.phone?.message} {...register('phone')} />
            </div>
          </div>

          {/* Mock Payment Selector */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-accent-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Payment Gateway (Simulated Instant Approval)
                </span>
              </div>
              <span className="text-xs font-black text-accent-500">
                {formatCurrency(grandTotal)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Mock payment verification simulates atomic bank authorization and commits transaction.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCheckoutModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <PackageCheck className="w-4 h-4 mr-2" />
              Pay & Confirm Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
