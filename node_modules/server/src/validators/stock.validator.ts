import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ObjectId'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(3, 'A clear reason is mandatory for stock movement').max(500).trim(),
});

export const stockLedgerQuerySchema = z.object({
  product: z.string().optional(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']).optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

export const lowStockQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type StockLedgerQueryInput = z.infer<typeof stockLedgerQuerySchema>;
export type LowStockQueryInput = z.infer<typeof lowStockQuerySchema>;
