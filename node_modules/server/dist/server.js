import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
const startServer = async () => {
    try {
        await connectDB();
        const app = createApp();
        const server = app.listen(env.PORT, () => {
            logger.info(`🚀 StockDrive IMS Server running on port ${env.PORT} [${env.NODE_ENV}]`);
            logger.info(`📚 Swagger Documentation available at http://localhost:${env.PORT}/api/docs`);
            logger.info(`🩺 Health check at http://localhost:${env.PORT}/health`);
        });
        const shutdown = async (signal) => {
            logger.info(`Received ${signal}. Shutting down gracefully...`);
            server.close(() => {
                logger.info('HTTP server closed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger.error({ error }, 'Failed to initialize server');
        process.exit(1);
    }
};
startServer();
