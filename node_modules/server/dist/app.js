import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { httpLogger } from './utils/logger.js';
import { swaggerSpec } from './utils/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { productRouter } from './routes/product.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { stockRouter } from './routes/stock.routes.js';
import { reportRouter } from './routes/report.routes.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const createApp = () => {
    const app = express();
    // Security Headers
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false, // Allows Swagger UI and local development assets
    }));
    // Compression
    app.use(compression());
    // CORS Configuration
    const allowedOrigins = [
        env.CLIENT_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    ];
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // HTTP Request Logging
    app.use(httpLogger);
    // Body Parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(cookieParser(env.COOKIE_SECRET));
    // Mongo Sanitize against NoSQL injection
    app.use(mongoSanitize());
    // Static uploads directory
    const uploadsDir = path.join(__dirname, '../uploads');
    app.use('/uploads', express.static(uploadsDir));
    // API Documentation
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    // REST API versioned endpoints
    const v1Router = express.Router();
    v1Router.use('/auth', authRouter);
    v1Router.use('/products', productRouter);
    v1Router.use('/orders', orderRouter);
    v1Router.use('/stock', stockRouter);
    v1Router.use('/reports', reportRouter);
    app.use('/api/v1', v1Router);
    // Error Handlers
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
};
