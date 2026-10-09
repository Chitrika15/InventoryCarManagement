import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { env } from '../config/env.js';
export const logger = pino({
    level: env.NODE_ENV === 'test' ? 'silent' : 'info',
    transport: env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
});
export const httpLogger = pinoHttp({
    logger,
    autoLogging: {
        ignore: (req) => Boolean(req.url?.startsWith('/api/docs') || req.url?.startsWith('/health')),
    },
    customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err)
            return 'error';
        if (res.statusCode >= 400)
            return 'warn';
        return 'info';
    },
});
