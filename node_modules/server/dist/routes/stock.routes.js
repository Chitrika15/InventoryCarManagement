import { Router } from 'express';
import { StockController } from '../controllers/stock.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { adjustStockSchema, stockLedgerQuerySchema, lowStockQuerySchema, } from '../validators/stock.validator.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
const router = Router();
// All stock routes are admin only
router.use(requireAuth, requireRole('admin'));
router.post('/adjust', validateRequest({ body: adjustStockSchema }), StockController.adjust);
router.get('/ledger', validateRequest({ query: stockLedgerQuerySchema }), StockController.ledger);
router.get('/alerts', validateRequest({ query: lowStockQuerySchema }), StockController.alerts);
export const stockRouter = router;
