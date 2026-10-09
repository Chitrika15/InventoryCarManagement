import { Product, IProduct } from '../models/Product.js';
import { StockMovement, IStockMovement } from '../models/StockMovement.js';
import { AuditLog } from '../models/AuditLog.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { AdjustStockInput, StockLedgerQueryInput, LowStockQueryInput } from '../validators/stock.validator.js';
import { PaginationMeta } from '../utils/apiResponse.js';

export class StockService {
  static async adjustStock(input: AdjustStockInput, actorId: string): Promise<IStockMovement> {
    const product = await Product.findById(input.productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const previousStock = product.stock;
    let newStock = previousStock;

    if (input.type === 'IN') {
      newStock = previousStock + input.quantity;
    } else if (input.type === 'OUT') {
      if (previousStock < input.quantity) {
        throw new BadRequestError(
          `Insufficient stock to remove ${input.quantity} units. Current stock is ${previousStock}. Stock can never go negative.`
        );
      }
      newStock = previousStock - input.quantity;
    } else if (input.type === 'ADJUSTMENT') {
      // In ADJUSTMENT mode, input.quantity represents the newly counted actual stock
      if (input.quantity < 0) {
        throw new BadRequestError('Adjusted stock quantity cannot be negative.');
      }
      newStock = input.quantity;
    }

    product.stock = newStock;
    await product.save();

    const movement = await StockMovement.create({
      product: product._id,
      type: input.type,
      quantity: input.type === 'ADJUSTMENT' ? Math.abs(newStock - previousStock) : input.quantity,
      previousStock,
      newStock,
      reason: input.reason,
      createdBy: actorId,
    });

    await AuditLog.create({
      actor: actorId,
      action: 'STOCK_ADJUSTED',
      entity: 'StockMovement',
      entityId: movement._id.toString(),
      meta: {
        productSku: product.sku,
        type: input.type,
        previousStock,
        newStock,
        reason: input.reason,
      },
    });

    return (await StockMovement.findById(movement._id)
      .populate('product', 'name sku brand stock reorderLevel imageUrl price')
      .populate('createdBy', 'name email'))!;
  }

  static async getLedger(query: StockLedgerQueryInput): Promise<{ movements: IStockMovement[]; meta: PaginationMeta }> {
    const filter: Record<string, unknown> = {};

    if (query.product) {
      filter.product = query.product;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, Date>).$lte = end;
      }
    }

    const skip = (query.page - 1) * query.limit;

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('product', 'name sku brand price imageUrl stock reorderLevel')
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      StockMovement.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      movements: movements as unknown as IStockMovement[],
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

  static async getLowStockAlerts(query: LowStockQueryInput): Promise<{ products: IProduct[]; meta: PaginationMeta }> {
    const filter = {
      isActive: true,
      $expr: { $lte: ['$stock', '$reorderLevel'] },
    };

    const skip = (query.page - 1) * query.limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ stock: 1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      products: products as unknown as IProduct[],
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
}
