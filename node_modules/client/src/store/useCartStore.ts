import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../types/index.js';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number; // in paise
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity: number = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.product._id === product._id);

        if (product.stock <= 0) {
          return { success: false, message: 'This item is currently out of stock' };
        }

        const currentQty = existing ? existing.quantity : 0;
        const requestedTotal = currentQty + quantity;

        if (requestedTotal > product.stock) {
          return {
            success: false,
            message: `Only ${product.stock} units available in stock. Cannot add more.`,
          };
        }

        if (existing) {
          set({
            items: items.map((i) =>
              i.product._id === product._id ? { ...i, quantity: requestedTotal } : i
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }

        return { success: true };
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((i) => i.product._id !== productId) });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { items } = get();
        const item = items.find((i) => i.product._id === productId);

        if (!item) return { success: false, message: 'Item not in cart' };

        if (quantity <= 0) {
          get().removeItem(productId);
          return { success: true };
        }

        if (quantity > item.product.stock) {
          return {
            success: false,
            message: `Cannot exceed available stock of ${item.product.stock} units`,
          };
        }

        set({
          items: items.map((i) =>
            i.product._id === productId ? { ...i, quantity } : i
          ),
        });

        return { success: true };
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((acc, i) => acc + i.quantity, 0);
      },

      getTotalAmount: () => {
        return get().items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
      },
    }),
    {
      name: 'stockdrive-cart-storage',
    }
  )
);
