import mongoose from 'mongoose';
import { Order, IOrder, OrderStatus, IOrderItem } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';
import { AuditLog } from '../models/AuditLog.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { CreateOrderInput, OrderQueryInput, UpdateOrderStatusInput } from '../validators/order.validator.js';
import { PaginationMeta } from '../utils/apiResponse.js';

const supportsReplicaSetTransactions = (): boolean => {
  try {
    const topology = (mongoose.connection.getClient() as any)?.topology;
    const type = topology?.description?.type?.toLowerCase() || '';
    return type.includes('replicaset') || type.includes('sharded') || type.includes('loadbalanced');
  } catch {
    return false;
  }
};

export class OrderService {
  private static generateOrderNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SD-${dateStr}-${rand}`;
  }

  static async createOrder(customerId: string, input: CreateOrderInput): Promise<IOrder> {
    const useTransaction = supportsReplicaSetTransactions();
    let session: mongoose.ClientSession | null = null;
    const decrementedProducts: { productId: mongoose.Types.ObjectId; qty: number }[] = [];

    try {
      if (useTransaction) {
        session = await mongoose.startSession();
        session.startTransaction();
      }

      // 1. Fetch and validate all products
      const productIds = input.items.map((i) => i.productId);
      const query = Product.find({ _id: { $in: productIds } });
      if (session) {
        query.session(session);
      }
      const products = await query;

      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      const orderItems: IOrderItem[] = [];
      let totalAmount = 0;

      for (const item of input.items) {
        const prod = productMap.get(item.productId);
        if (!prod) {
          throw new BadRequestError(`Product with ID '${item.productId}' not found`);
        }

        if (!prod.isActive) {
          throw new BadRequestError(`Product '${prod.name}' (${prod.sku}) is currently unavailable`);
        }

        if (prod.stock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for '${prod.name}'. Available: ${prod.stock}, Requested: ${item.quantity}`
          );
        }

        // Snapshot details at purchase time
        orderItems.push({
          product: prod._id,
          name: prod.name,
          sku: prod.sku,
          unitPrice: prod.price,
          quantity: item.quantity,
        });

        totalAmount += prod.price * item.quantity;
      }

      // 2. Decrement stock atomically
      for (const item of input.items) {
        const prod = productMap.get(item.productId)!;
        const previousStock = prod.stock;
        const newStock = previousStock - item.quantity;

        const updateRes = await Product.updateOne(
          { _id: prod._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          session ? { session } : undefined
        );

        if (updateRes.matchedCount === 0 || updateRes.modifiedCount === 0) {
          throw new BadRequestError(`Failed to reserve stock for '${prod.name}'. Please retry checkout.`);
        }

        decrementedProducts.push({ productId: prod._id, qty: item.quantity });

        // Record Stock Movement
        await StockMovement.create(
          [
            {
              product: prod._id,
              type: 'OUT',
              quantity: item.quantity,
              previousStock,
              newStock,
              reason: 'Customer order purchase',
              createdBy: customerId,
            },
          ],
          session ? { session } : undefined
        );
      }

      // 3. Create the Order
      const orderNumber = this.generateOrderNumber();
      const orderDocs = await Order.create(
        [
          {
            orderNumber,
            customer: customerId,
            items: orderItems,
            totalAmount,
            shippingAddress: input.shippingAddress,
            status: 'PENDING',
            statusHistory: [
              {
                status: 'PENDING',
                at: new Date(),
                by: customerId,
                note: 'Order successfully created with mock payment verified',
              },
            ],
          },
        ],
        session ? { session } : undefined
      );

      const createdOrder = orderDocs[0];

      // 4. Record Audit Log
      await AuditLog.create(
        [
          {
            actor: customerId,
            action: 'ORDER_PLACED',
            entity: 'Order',
            entityId: createdOrder._id.toString(),
            meta: {
              orderNumber: createdOrder.orderNumber,
              totalAmount: createdOrder.totalAmount,
              itemsCount: orderItems.length,
            },
          },
        ],
        session ? { session } : undefined
      );

      if (session) {
        await session.commitTransaction();
      }

      return createdOrder;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      } else {
        // Rollback already decremented products in standalone environment
        for (const dec of decrementedProducts) {
          await Product.updateOne({ _id: dec.productId }, { $inc: { stock: dec.qty } });
        }
      }
      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  static async listOrders(
    query: OrderQueryInput,
    userRole: string,
    userId: string
  ): Promise<{ orders: IOrder[]; meta: PaginationMeta }> {
    const filter: Record<string, unknown> = {};

    if (userRole === 'customer') {
      filter.customer = userId;
    } else if (query.customer) {
      filter.customer = query.customer;
    }

    if (query.status) {
      filter.status = query.status;
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

    if (query.search && query.search.trim()) {
      filter.orderNumber = { $regex: query.search.trim(), $options: 'i' };
    }

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      orders: orders as unknown as IOrder[],
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

  static async getOrderById(orderIdOrNumber: string, userRole: string, userId: string): Promise<IOrder> {
    const isObjectId = orderIdOrNumber.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: orderIdOrNumber } : { orderNumber: orderIdOrNumber };

    const order = await Order.findOne(query)
      .populate('customer', 'name email')
      .populate('items.product', 'imageUrl category brand')
      .populate('statusHistory.by', 'name role');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (userRole === 'customer' && order.customer._id.toString() !== userId) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  static async updateOrderStatus(
    orderId: string,
    input: UpdateOrderStatusInput,
    actorId: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const prevStatus = order.status;
    const newStatus = input.status;

    if (prevStatus === newStatus) {
      return order;
    }

    if (prevStatus === 'CANCELLED') {
      throw new BadRequestError('Cannot update an already cancelled order');
    }

    if (prevStatus === 'DELIVERED' && newStatus !== 'CANCELLED') {
      throw new BadRequestError('Delivered orders cannot be moved back to an earlier status');
    }

    // Restock items atomically if cancelling
    if (newStatus === 'CANCELLED') {
      for (const item of order.items) {
        const prod = await Product.findById(item.product);
        if (prod) {
          const previousStock = prod.stock;
          const newStock = previousStock + item.quantity;

          await Product.findByIdAndUpdate(prod._id, { $inc: { stock: item.quantity } });

          await StockMovement.create({
            product: prod._id,
            type: 'IN',
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: `Restocked due to order cancellation #${order.orderNumber}`,
            createdBy: actorId,
          });
        }
      }
    }

    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      at: new Date(),
      by: new mongoose.Types.ObjectId(actorId),
      note: input.note || `Status updated from ${prevStatus} to ${newStatus}`,
    });

    await order.save();

    await AuditLog.create({
      actor: actorId,
      action: 'ORDER_STATUS_CHANGED',
      entity: 'Order',
      entityId: order._id.toString(),
      meta: {
        orderNumber: order.orderNumber,
        previousStatus: prevStatus,
        newStatus: newStatus,
        note: input.note,
      },
    });

    return (await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('statusHistory.by', 'name role'))!;
  }
}
