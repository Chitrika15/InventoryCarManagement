import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { setupTestDB } from './setup.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { StockMovement } from '../models/StockMovement.js';
import { AuthService } from '../services/auth.service.js';
import { StockService } from '../services/stock.service.js';
import { OrderService } from '../services/order.service.js';

setupTestDB();

describe('Business Rules & Services Unit Tests', () => {
  let adminUser: any;
  let customerUser: any;
  let category: any;
  let product: any;

  beforeEach(async () => {
    // Seed test fixtures
    adminUser = await User.create({
      name: 'Admin Tester',
      email: 'admin.test@stockdrive.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    customerUser = await User.create({
      name: 'Customer Tester',
      email: 'customer.test@stockdrive.com',
      passwordHash: 'hash',
      role: 'customer',
    });

    category = await Category.create({
      name: 'Lighting',
      slug: 'lighting',
    });

    product = await Product.create({
      sku: 'LGT-TST-001',
      name: 'Test LED Projector',
      category: category._id,
      brand: 'Osram',
      price: 500000, // ₹5,000.00 (500,000 paise)
      costPrice: 350000,
      stock: 10,
      reorderLevel: 3,
      isActive: true,
    });
  });

  describe('Rule 1: Stock can never go negative', () => {
    it('should successfully increase stock on type IN', async () => {
      const movement = await StockService.adjustStock(
        {
          productId: product._id.toString(),
          type: 'IN',
          quantity: 5,
          reason: 'Supplier shipment',
        },
        adminUser._id.toString()
      );

      expect(movement.newStock).toBe(15);
      const updated = await Product.findById(product._id);
      expect(updated?.stock).toBe(15);
    });

    it('should reject stock reduction if quantity exceeds current stock', async () => {
      await expect(
        StockService.adjustStock(
          {
            productId: product._id.toString(),
            type: 'OUT',
            quantity: 15, // product has 10
            reason: 'Defective batch return',
          },
          adminUser._id.toString()
        )
      ).rejects.toThrow(/Stock can never go negative|Insufficient stock/);

      const unchanged = await Product.findById(product._id);
      expect(unchanged?.stock).toBe(10);
    });
  });

  describe('Rule 2: Order placement is transactional, snapshots price/SKU/name, and decrements stock', () => {
    it('should decrement stock and snapshot product attributes at purchase time', async () => {
      const order = await OrderService.createOrder(customerUser._id.toString(), {
        items: [{ productId: product._id.toString(), quantity: 3 }],
        shippingAddress: {
          fullName: 'Customer Tester',
          addressLine1: '123 Test St',
          city: 'Bangalore',
          state: 'KA',
          postalCode: '560001',
          phone: '+91 99999 88888',
        },
      });

      expect(order.status).toBe('PENDING');
      expect(order.items).toHaveLength(1);
      expect(order.items[0].name).toBe('Test LED Projector');
      expect(order.items[0].sku).toBe('LGT-TST-001');
      expect(order.items[0].unitPrice).toBe(500000);
      expect(order.totalAmount).toBe(1500000); // 3 * 500000 paise

      // Stock was decremented from 10 to 7
      const updated = await Product.findById(product._id);
      expect(updated?.stock).toBe(7);

      // Verify StockMovement recorded
      const movement = await StockMovement.findOne({ product: product._id, type: 'OUT' });
      expect(movement).toBeTruthy();
      expect(movement?.quantity).toBe(3);
    });

    it('should fail order placement if stock is insufficient', async () => {
      await expect(
        OrderService.createOrder(customerUser._id.toString(), {
          items: [{ productId: product._id.toString(), quantity: 15 }], // 15 > 10
          shippingAddress: {
            fullName: 'Customer Tester',
            addressLine1: '123 Test St',
            city: 'Bangalore',
            state: 'KA',
            postalCode: '560001',
            phone: '+91 99999 88888',
          },
        })
      ).rejects.toThrow(/Insufficient stock/);

      // Verify stock remained unchanged
      const unchanged = await Product.findById(product._id);
      expect(unchanged?.stock).toBe(10);
    });
  });

  describe('Rule 3: Order cancellation restocks items automatically', () => {
    it('should atomically restock items and log StockMovement IN when order is cancelled', async () => {
      const order = await OrderService.createOrder(customerUser._id.toString(), {
        items: [{ productId: product._id.toString(), quantity: 4 }],
        shippingAddress: {
          fullName: 'Customer Tester',
          addressLine1: '123 Test St',
          city: 'Bangalore',
          state: 'KA',
          postalCode: '560001',
          phone: '+91 99999 88888',
        },
      });

      // Stock should now be 6 (10 - 4)
      let currentProd = await Product.findById(product._id);
      expect(currentProd?.stock).toBe(6);

      // Admin or Customer cancels order
      const cancelledOrder = await OrderService.updateOrderStatus(
        order._id.toString(),
        { status: 'CANCELLED', note: 'Customer changed mind' },
        adminUser._id.toString()
      );

      expect(cancelledOrder.status).toBe('CANCELLED');

      // Stock should be restored back to 10
      currentProd = await Product.findById(product._id);
      expect(currentProd?.stock).toBe(10);

      // Verify restock movement
      const restockMovement = await StockMovement.findOne({
        product: product._id,
        type: 'IN',
        reason: { $regex: /Restocked due to order cancellation/ },
      });
      expect(restockMovement).toBeTruthy();
      expect(restockMovement?.quantity).toBe(4);
    });
  });

  describe('Rule 4: Authentication & Password Security', () => {
    it('should register a new customer with hashed password and return tokens', async () => {
      const result = await AuthService.register({
        name: 'New Driver',
        email: 'newdriver@stockdrive.com',
        password: 'Password@123',
      });

      expect(result.user.email).toBe('newdriver@stockdrive.com');
      expect(result.user.role).toBe('customer');
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();

      const savedUser = await User.findById(result.user.id);
      expect(savedUser?.passwordHash).not.toBe('Password@123');
      expect(savedUser?.refreshTokenHash).toBeTruthy();
    });

    it('should rotate refresh token upon refreshTokens call', async () => {
      const auth = await AuthService.register({
        name: 'Token Driver',
        email: 'tokendriver@stockdrive.com',
        password: 'Password@123',
      });

      const originalRefreshToken = auth.refreshToken;
      const refreshed = await AuthService.refreshTokens(originalRefreshToken);

      expect(refreshed.accessToken).toBeTruthy();
      expect(refreshed.refreshToken).toBeTruthy();
      expect(refreshed.refreshToken).not.toBe(originalRefreshToken);

      // Old token reuse should fail
      await expect(AuthService.refreshTokens(originalRefreshToken)).rejects.toThrow(
        /Refresh token reuse detected|session expired/i
      );
    });
  });
});
