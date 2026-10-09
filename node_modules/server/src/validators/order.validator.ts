import { z } from 'zod';

export const orderItemInputSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ObjectId'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const shippingAddressInputSchema = z.object({
  fullName: z.string().min(2).max(100).trim(),
  addressLine1: z.string().min(3).max(200).trim(),
  addressLine2: z.string().max(200).optional().default(''),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  postalCode: z.string().min(4).max(20).trim(),
  phone: z.string().min(8).max(20).trim(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least 1 item'),
  shippingAddress: shippingAddressInputSchema,
});

export const orderQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  customer: z.string().optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().max(500).optional().default(''),
});

export const orderIdParamSchema = z.object({
  id: z.string(), // could be ObjectId or orderNumber
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
