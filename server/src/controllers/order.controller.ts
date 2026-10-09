import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { OrderQueryInput } from '../validators/order.validator.js';

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user!.userId;
      const order = await OrderService.createOrder(customerId, req.body);
      sendSuccess(res, order, 201);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, userId } = req.user!;
      const result = await OrderService.listOrders(
        req.query as unknown as OrderQueryInput,
        role,
        userId
      );
      sendSuccess(res, result.orders, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, userId } = req.user!;
      const order = await OrderService.getOrderById(req.params.id, role, userId);
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user!.userId;
      const order = await OrderService.updateOrderStatus(req.params.id, req.body, actorId);
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  static async cancelMyOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.user!;
      const order = await OrderService.updateOrderStatus(
        req.params.id,
        { status: 'CANCELLED', note: 'Order cancelled by customer' },
        userId
      );
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }
}
