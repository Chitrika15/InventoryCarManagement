import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { setupTestDB } from './setup.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import bcrypt from 'bcryptjs';

setupTestDB();

describe('StockDrive IMS API Integration Tests', () => {
  const app = createApp();
  let adminToken: string;
  let customerToken: string;
  let testProduct: any;

  beforeEach(async () => {
    // Seed test users & product before each test since afterEach cleans collections
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const customerPasswordHash = await bcrypt.hash('Customer@123', 10);

    await User.create({
      name: 'Admin User',
      email: 'admin@stockdrive.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });

    await User.create({
      name: 'Customer User',
      email: 'customer@stockdrive.com',
      passwordHash: customerPasswordHash,
      role: 'customer',
    });

    const category = await Category.create({
      name: 'Tyres & Alloys',
      slug: 'tyres-alloys',
    });

    testProduct = await Product.create({
      sku: 'TYR-API-001',
      name: 'Michelin Pilot Sport 4',
      category: category._id,
      brand: 'Michelin',
      price: 1200000,
      costPrice: 900000,
      stock: 20,
      reorderLevel: 5,
      isActive: true,
    });

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@stockdrive.com', password: 'Admin@123' });
    adminToken = adminLoginRes.body.data.accessToken;

    const customerLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@stockdrive.com', password: 'Customer@123' });
    customerToken = customerLoginRes.body.data.accessToken;
  });

  describe('Swagger & Health Endpoints', () => {
    it('GET /health returns status healthy', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    it('GET /api/docs serves Swagger UI html', async () => {
      const res = await request(app).get('/api/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Swagger UI');
    });
  });

  describe('Products Endpoints', () => {
    it('GET /api/v1/products returns paginated products with metadata', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
    });

    it('GET /api/v1/products/:id returns the requested product', async () => {
      const res = await request(app).get(`/api/v1/products/${testProduct._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.sku).toBe('TYR-API-001');
    });
  });

  describe('RBAC & Protected Endpoints', () => {
    it('Customer cannot access Admin stock ledger endpoint (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/stock/ledger')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Admin can access stock alerts endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/stock/alerts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Admin can view reports KPIs', async () => {
      const res = await request(app)
        .get('/api/v1/reports/kpis')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalRevenue');
      expect(res.body.data).toHaveProperty('totalOrders');
    });
  });

  describe('Order Checkout via API', () => {
    it('Customer can create an order successfully', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: testProduct._id.toString(), quantity: 2 }],
          shippingAddress: {
            fullName: 'Customer User',
            addressLine1: '402 Skyline Boulevard',
            city: 'Chennai',
            state: 'TN',
            postalCode: '600001',
            phone: '+91 91234 56789',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toMatch(/^SD-\d{8}-\d{4}$/);
      expect(res.body.data.totalAmount).toBe(2400000);
    });
  });
});
