import { describe, it, expect } from 'vitest';
import { formatCurrency, getStockStatus } from '../lib/utils.js';

describe('Client Utility Functions', () => {
  it('formats paise correctly into Indian Rupee currency format', () => {
    // 500000 paise = ₹5,000.00
    const formatted = formatCurrency(500000);
    expect(formatted).toContain('5,000');
  });

  it('determines correct stock badges for in_stock, low_stock, out_of_stock', () => {
    const outOfStock = getStockStatus(0, 5);
    expect(outOfStock.variant).toBe('out_of_stock');
    expect(outOfStock.label).toBe('Out of Stock');

    const lowStock = getStockStatus(3, 5);
    expect(lowStock.variant).toBe('low_stock');
    expect(lowStock.label).toContain('Low Stock (3 left)');

    const inStock = getStockStatus(15, 5);
    expect(inStock.variant).toBe('in_stock');
    expect(inStock.label).toContain('In Stock (15)');
  });
});
