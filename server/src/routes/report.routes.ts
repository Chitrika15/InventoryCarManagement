import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// All reporting routes are admin only
router.use(requireAuth, requireRole('admin'));

router.get('/kpis', ReportController.getKPIs);
router.get('/revenue', ReportController.getRevenueChart);
router.get('/top-sellers', ReportController.getTopSellers);
router.get('/category-stock', ReportController.getCategoryStock);
router.get('/export/orders', ReportController.downloadOrdersCSV);
router.get('/export/stock', ReportController.downloadStockCSV);
router.get('/export/low-stock', ReportController.downloadLowStockCSV);

export const reportRouter = router;
