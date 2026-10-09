import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../store/useCartStore.js';
import { Product } from '../types/index.js';

describe('Zustand useCartStore Unit Tests', () => {
  const dummyProduct: Product = {
    _id: 'prod123',
    sku: 'TYR-MIC-001',
    name: 'Michelin Primacy 4 ST',
    category: 'cat1',
    brand: 'Michelin',
    price: 920000, // ₹9,200.00
    costPrice: 740000,
    stock: 5,
    reorderLevel: 2,
    description: 'High performance tyre',
    imageUrl: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('adds an item to cart and updates count and total amount', () => {
    const store = useCartStore.getState();
    const res = store.addItem(dummyProduct, 2);

    expect(res.success).toBe(true);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getTotalAmount()).toBe(1840000); // 2 * 920000 paise
  });

  it('enforces stock limits when adding more than available warehouse stock', () => {
    const store = useCartStore.getState();
    // Try adding 10 when stock is only 5
    const res = store.addItem(dummyProduct, 10);

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Only 5 units available in stock/);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updates quantity and prevents exceeding available stock', () => {
    const store = useCartStore.getState();
    store.addItem(dummyProduct, 2);

    const updateRes = store.updateQuantity('prod123', 6);
    expect(updateRes.success).toBe(false);
    expect(updateRes.message).toMatch(/Cannot exceed available stock of 5 units/);

    // Valid update to 4 units
    const validRes = store.updateQuantity('prod123', 4);
    expect(validRes.success).toBe(true);
    expect(useCartStore.getState().getTotalItems()).toBe(4);
  });

  it('removes item from cart', () => {
    const store = useCartStore.getState();
    store.addItem(dummyProduct, 2);
    expect(useCartStore.getState().items).toHaveLength(1);

    store.removeItem('prod123');
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
