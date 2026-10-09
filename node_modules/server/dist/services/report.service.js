import { Parser } from 'json2csv';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';
export class ReportService {
    static async getDashboardKPIs() {
        const [orderStats, lowStockCount, productStats] = await Promise.all([
            Order.aggregate([
                { $match: { status: { $ne: 'CANCELLED' } } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalAmount' },
                        totalOrders: { $sum: 1 },
                    },
                },
            ]),
            Product.countDocuments({
                isActive: true,
                $expr: { $lte: ['$stock', '$reorderLevel'] },
            }),
            Product.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalInventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
                    },
                },
            ]),
        ]);
        const unitsSoldStats = await Order.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: null,
                    totalUnits: { $sum: '$items.quantity' },
                },
            },
        ]);
        return {
            totalRevenue: orderStats[0]?.totalRevenue || 0,
            totalOrders: orderStats[0]?.totalOrders || 0,
            unitsSold: unitsSoldStats[0]?.totalUnits || 0,
            lowStockCount,
            totalProducts: productStats[0]?.totalProducts || 0,
            totalInventoryValue: productStats[0]?.totalInventoryValue || 0,
        };
    }
    static async getRevenueOverTime(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const points = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'CANCELLED' },
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    revenue: { $sum: '$totalAmount' },
                    ordersCount: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        return points.map((p) => ({
            date: p._id,
            revenue: p.revenue,
            ordersCount: p.ordersCount,
        }));
    }
    static async getTopSellers(limit = 6) {
        const sellers = await Order.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    sku: { $first: '$items.sku' },
                    unitsSold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
                },
            },
            { $sort: { unitsSold: -1 } },
            { $limit: limit },
        ]);
        return sellers.map((s) => ({
            productId: s._id?.toString() || '',
            name: s.name,
            sku: s.sku,
            unitsSold: s.unitsSold,
            revenue: s.revenue,
        }));
    }
    static async getStockValueByCategory() {
        const data = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'cat',
                },
            },
            { $unwind: '$cat' },
            {
                $group: {
                    _id: '$cat._id',
                    categoryName: { $first: '$cat.name' },
                    slug: { $first: '$cat.slug' },
                    productCount: { $sum: 1 },
                    totalStockUnits: { $sum: '$stock' },
                    totalStockValue: { $sum: { $multiply: ['$price', '$stock'] } },
                    totalCostValue: { $sum: { $multiply: ['$costPrice', '$stock'] } },
                },
            },
            { $sort: { totalStockValue: -1 } },
        ]);
        return data.map((d) => ({
            categoryId: d._id.toString(),
            categoryName: d.categoryName,
            slug: d.slug,
            productCount: d.productCount,
            totalStockUnits: d.totalStockUnits,
            totalStockValue: d.totalStockValue,
            totalCostValue: d.totalCostValue,
        }));
    }
    static async exportOrdersCSV() {
        const orders = await Order.find().populate('customer', 'name email').sort({ createdAt: -1 }).lean();
        const flatOrders = orders.map((o) => ({
            orderNumber: o.orderNumber,
            date: new Date(o.createdAt).toISOString(),
            customerName: o.customer?.name || 'N/A',
            customerEmail: o.customer?.email || 'N/A',
            status: o.status,
            itemsCount: o.items.length,
            totalAmountINR: (o.totalAmount / 100).toFixed(2),
            shippingCity: o.shippingAddress?.city || '',
            shippingState: o.shippingAddress?.state || '',
            shippingPostalCode: o.shippingAddress?.postalCode || '',
        }));
        const parser = new Parser({
            fields: [
                'orderNumber',
                'date',
                'customerName',
                'customerEmail',
                'status',
                'itemsCount',
                'totalAmountINR',
                'shippingCity',
                'shippingState',
                'shippingPostalCode',
            ],
        });
        return parser.parse(flatOrders);
    }
    static async exportStockLedgerCSV() {
        const movements = await StockMovement.find()
            .populate('product', 'name sku brand')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        const flatMovements = movements.map((m) => ({
            timestamp: new Date(m.createdAt).toISOString(),
            productSku: m.product?.sku || 'N/A',
            productName: m.product?.name || 'N/A',
            type: m.type,
            quantityDelta: m.quantity,
            previousStock: m.previousStock,
            newStock: m.newStock,
            reason: m.reason,
            performedBy: m.createdBy?.name || 'System',
        }));
        const parser = new Parser({
            fields: [
                'timestamp',
                'productSku',
                'productName',
                'type',
                'quantityDelta',
                'previousStock',
                'newStock',
                'reason',
                'performedBy',
            ],
        });
        return parser.parse(flatMovements);
    }
    static async exportLowStockCSV() {
        const products = await Product.find({
            isActive: true,
            $expr: { $lte: ['$stock', '$reorderLevel'] },
        })
            .populate('category', 'name')
            .sort({ stock: 1 })
            .lean();
        const flatProducts = products.map((p) => ({
            sku: p.sku,
            name: p.name,
            category: p.category?.name || 'N/A',
            brand: p.brand,
            currentStock: p.stock,
            reorderLevel: p.reorderLevel,
            priceINR: (p.price / 100).toFixed(2),
            costPriceINR: (p.costPrice / 100).toFixed(2),
            shortage: Math.max(0, p.reorderLevel - p.stock),
        }));
        const parser = new Parser({
            fields: [
                'sku',
                'name',
                'category',
                'brand',
                'currentStock',
                'reorderLevel',
                'priceINR',
                'costPriceINR',
                'shortage',
            ],
        });
        return parser.parse(flatProducts);
    }
}
