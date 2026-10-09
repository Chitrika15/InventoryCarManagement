import { z } from 'zod';
export const productQuerySchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(), // slug or ObjectId
    brand: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(), // in paise
    maxPrice: z.coerce.number().min(0).optional(),
    stockStatus: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock']).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'name_asc', 'stock_asc', 'stock_desc']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    includeInactive: z.enum(['true', 'false']).optional(),
});
export const createProductSchema = z.object({
    sku: z.string().min(2).max(50).toUpperCase().trim(),
    name: z.string().min(2).max(200).trim(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ObjectId'),
    brand: z.string().min(1).max(100).trim(),
    price: z.number().int().min(0, 'Price must be non-negative integer (paise)'),
    costPrice: z.number().int().min(0, 'Cost price must be non-negative integer (paise)'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    reorderLevel: z.number().int().min(0).default(5),
    description: z.string().max(3000).default(''),
    imageUrl: z.string().url().or(z.string().startsWith('/uploads/')).optional().default(''),
    isActive: z.boolean().default(true),
});
export const updateProductSchema = createProductSchema.partial();
export const productIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ObjectId'),
});
