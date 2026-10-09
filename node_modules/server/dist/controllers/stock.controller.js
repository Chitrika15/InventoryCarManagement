import { StockService } from '../services/stock.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
export class StockController {
    static async adjust(req, res, next) {
        try {
            const actorId = req.user.userId;
            const movement = await StockService.adjustStock(req.body, actorId);
            sendSuccess(res, movement, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async ledger(req, res, next) {
        try {
            const result = await StockService.getLedger(req.query);
            sendSuccess(res, result.movements, 200, result.meta);
        }
        catch (err) {
            next(err);
        }
    }
    static async alerts(req, res, next) {
        try {
            const result = await StockService.getLowStockAlerts(req.query);
            sendSuccess(res, result.products, 200, result.meta);
        }
        catch (err) {
            next(err);
        }
    }
}
