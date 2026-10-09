import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { StockMovement } from '../models/StockMovement.js';
import { AuditLog } from '../models/AuditLog.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';
export class ProductService {
    static async listProducts(query) {
        const filter = {};
        // Active status filter (default: only active products, unless includeInactive is true)
        if (query.includeInactive !== 'true') {
            filter.isActive = true;
        }
        // Category filter (slug or ObjectId)
        if (query.category) {
            if (query.category.match(/^[0-9a-fA-F]{24}$/)) {
                filter.category = query.category;
            }
            else {
                const cat = await Category.findOne({ slug: query.category });
                if (cat) {
                    filter.category = cat._id;
                }
                else {
                    // Non-existent slug returns empty list
                    return {
                        products: [],
                        meta: {
                            page: query.page,
                            limit: query.limit,
                            total: 0,
                            totalPages: 0,
                            hasNext: false,
                            hasPrev: false,
                        },
                    };
                }
            }
        }
        // Brand filter
        if (query.brand) {
            filter.brand = new RegExp(`^${query.brand}$`, 'i');
        }
        // Price range (in paise)
        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            filter.price = {};
            if (query.minPrice !== undefined) {
                filter.price.$gte = query.minPrice;
            }
            if (query.maxPrice !== undefined) {
                filter.price.$lte = query.maxPrice;
            }
        }
        // Text search or regex fallback
        if (query.search && query.search.trim()) {
            const searchTerm = query.search.trim();
            filter.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { sku: { $regex: searchTerm, $options: 'i' } },
                { brand: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
            ];
        }
        // Stock status filter
        if (query.stockStatus === 'in_stock') {
            filter.stock = { $gt: 0 };
        }
        else if (query.stockStatus === 'out_of_stock') {
            filter.stock = 0;
        }
        else if (query.stockStatus === 'low_stock') {
            // low stock: stock > 0 and stock <= reorderLevel
            filter.$expr = {
                $and: [
                    { $gt: ['$stock', 0] },
                    { $lte: ['$stock', '$reorderLevel'] },
                ],
            };
        }
        // Sort order
        let sortOptions = { createdAt: -1 };
        switch (query.sort) {
            case 'price_asc':
                sortOptions = { price: 1 };
                break;
            case 'price_desc':
                sortOptions = { price: -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'stock_asc':
                sortOptions = { stock: 1 };
                break;
            case 'stock_desc':
                sortOptions = { stock: -1 };
                break;
            case 'newest':
            default:
                sortOptions = { createdAt: -1 };
                break;
        }
        const skip = (query.page - 1) * query.limit;
        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name slug')
                .sort(sortOptions)
                .skip(skip)
                .limit(query.limit)
                .lean(),
            Product.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / query.limit) || 1;
        return {
            products: products,
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages,
                hasNext: query.page < totalPages,
                hasPrev: query.page > 1,
            },
        };
    }
    static async getProductById(id) {
        const product = await Product.findById(id).populate('category', 'name slug');
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        return product;
    }
    static async createProduct(input, actorId) {
        const existing = await Product.findOne({ sku: input.sku.toUpperCase() });
        if (existing) {
            throw new ConflictError(`Product with SKU '${input.sku}' already exists`);
        }
        const category = await Category.findById(input.category);
        if (!category) {
            throw new BadRequestError('Category specified does not exist');
        }
        const product = await Product.create({
            ...input,
            sku: input.sku.toUpperCase(),
        });
        if (actorId && input.stock > 0) {
            await StockMovement.create({
                product: product._id,
                type: 'IN',
                quantity: input.stock,
                previousStock: 0,
                newStock: input.stock,
                reason: 'Initial stock on product creation',
                createdBy: actorId,
            });
        }
        if (actorId) {
            await AuditLog.create({
                actor: actorId,
                action: 'PRODUCT_CREATED',
                entity: 'Product',
                entityId: product._id.toString(),
                meta: { sku: product.sku, name: product.name, price: product.price, stock: product.stock },
            });
        }
        return (await Product.findById(product._id).populate('category', 'name slug'));
    }
    static async updateProduct(id, input, actorId) {
        const product = await Product.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        if (input.sku && input.sku.toUpperCase() !== product.sku) {
            const existing = await Product.findOne({ sku: input.sku.toUpperCase() });
            if (existing) {
                throw new ConflictError(`Product with SKU '${input.sku}' already exists`);
            }
            product.sku = input.sku.toUpperCase();
        }
        if (input.category) {
            const category = await Category.findById(input.category);
            if (!category) {
                throw new BadRequestError('Category does not exist');
            }
            product.category = category._id;
        }
        if (input.name !== undefined)
            product.name = input.name;
        if (input.brand !== undefined)
            product.brand = input.brand;
        if (input.price !== undefined)
            product.price = input.price;
        if (input.costPrice !== undefined)
            product.costPrice = input.costPrice;
        if (input.reorderLevel !== undefined)
            product.reorderLevel = input.reorderLevel;
        if (input.description !== undefined)
            product.description = input.description;
        if (input.imageUrl !== undefined)
            product.imageUrl = input.imageUrl;
        if (input.isActive !== undefined)
            product.isActive = input.isActive;
        // Handle direct stock adjustment if provided in update
        if (input.stock !== undefined && input.stock !== product.stock) {
            const prevStock = product.stock;
            const newStock = input.stock;
            const diff = newStock - prevStock;
            product.stock = newStock;
            if (actorId) {
                await StockMovement.create({
                    product: product._id,
                    type: diff > 0 ? 'IN' : 'ADJUSTMENT',
                    quantity: Math.abs(diff),
                    previousStock: prevStock,
                    newStock: newStock,
                    reason: 'Manual stock change via product update form',
                    createdBy: actorId,
                });
            }
        }
        await product.save();
        if (actorId) {
            await AuditLog.create({
                actor: actorId,
                action: 'PRODUCT_UPDATED',
                entity: 'Product',
                entityId: product._id.toString(),
                meta: input,
            });
        }
        return (await Product.findById(product._id).populate('category', 'name slug'));
    }
    static async softDeleteProduct(id, actorId) {
        const product = await Product.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        product.isActive = false;
        await product.save();
        if (actorId) {
            await AuditLog.create({
                actor: actorId,
                action: 'PRODUCT_SOFT_DELETED',
                entity: 'Product',
                entityId: product._id.toString(),
                meta: { sku: product.sku, name: product.name },
            });
        }
        return product;
    }
    static async listCategories() {
        return Category.find().sort({ name: 1 });
    }
    static async listBrands() {
        return Product.distinct('brand', { isActive: true });
    }
}
