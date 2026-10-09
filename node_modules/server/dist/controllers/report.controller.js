import { ReportService } from '../services/report.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
export class ReportController {
    static async getKPIs(_req, res, next) {
        try {
            const kpis = await ReportService.getDashboardKPIs();
            sendSuccess(res, kpis);
        }
        catch (err) {
            next(err);
        }
    }
    static async getRevenueChart(req, res, next) {
        try {
            const days = req.query.days ? parseInt(req.query.days, 10) : 30;
            const chart = await ReportService.getRevenueOverTime(days);
            sendSuccess(res, chart);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTopSellers(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;
            const sellers = await ReportService.getTopSellers(limit);
            sendSuccess(res, sellers);
        }
        catch (err) {
            next(err);
        }
    }
    static async getCategoryStock(_req, res, next) {
        try {
            const categoryData = await ReportService.getStockValueByCategory();
            sendSuccess(res, categoryData);
        }
        catch (err) {
            next(err);
        }
    }
    static async downloadOrdersCSV(_req, res, next) {
        try {
            const csv = await ReportService.exportOrdersCSV();
            res.header('Content-Type', 'text/csv');
            res.attachment(`stockdrive-orders-${Date.now()}.csv`);
            res.send(csv);
        }
        catch (err) {
            next(err);
        }
    }
    static async downloadStockCSV(_req, res, next) {
        try {
            const csv = await ReportService.exportStockLedgerCSV();
            res.header('Content-Type', 'text/csv');
            res.attachment(`stockdrive-stock-ledger-${Date.now()}.csv`);
            res.send(csv);
        }
        catch (err) {
            next(err);
        }
    }
    static async downloadLowStockCSV(_req, res, next) {
        try {
            const csv = await ReportService.exportLowStockCSV();
            res.header('Content-Type', 'text/csv');
            res.attachment(`stockdrive-low-stock-alert-${Date.now()}.csv`);
            res.send(csv);
        }
        catch (err) {
            next(err);
        }
    }
}
