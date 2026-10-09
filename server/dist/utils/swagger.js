import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env.js';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'StockDrive IMS API',
            version: '1.0.0',
            description: 'Production-quality REST API for StockDrive IMS — Inventory Management System for Car Accessories',
            contact: {
                name: 'StockDrive IMS Support',
                email: 'support@stockdrive.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}/api/v1`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT access token',
                },
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object', nullable: true },
                        error: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                message: { type: 'string' },
                                code: { type: 'string' },
                                details: { type: 'object' },
                            },
                        },
                        meta: { type: 'object' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
export const swaggerSpec = swaggerJsdoc(options);
