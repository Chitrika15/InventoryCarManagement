import { Request, Response, NextFunction } from 'express';
import { StockService } from '../services/stock.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { StockLedgerQueryInput, LowStockQueryInput } from '../validators/stock.validator.js';

export class StockController {
  static async adjust(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user!.userId;
      const movement = await StockService.adjustStock(req.body, actorId);
      sendSuccess(res, movement, 201);
    } catch (err) {
      next(err);
    }
  }

  static async ledger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StockService.getLedger(req.query as unknown as StockLedgerQueryInput);
      sendSuccess(res, result.movements, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  static async alerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StockService.getLowStockAlerts(req.query as unknown as LowStockQueryInput);
      sendSuccess(res, result.products, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }
}
