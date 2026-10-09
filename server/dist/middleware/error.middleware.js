import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
export const errorHandler = (err, _req, res, _next) => {
    // 1. Custom Application Error
    if (err instanceof AppError) {
        sendError(res, err.message, err.statusCode, err.code, err.details);
        return;
    }
    // 2. Mongoose Duplicate Key Error
    if ('code' in err && err.code === 11000) {
        const keyValue = err.keyValue;
        const field = keyValue ? Object.keys(keyValue)[0] : 'field';
        const val = keyValue ? keyValue[field] : '';
        sendError(res, `Duplicate value '${val}' for field '${field}'. Must be unique.`, 409, 'DUPLICATE_KEY_ERROR', { field, value: val });
        return;
    }
    // 3. Mongoose Cast Error (Invalid ObjectId)
    if (err.name === 'CastError') {
        sendError(res, 'Invalid resource identifier format', 400, 'INVALID_ID_FORMAT');
        return;
    }
    // 4. JWT Verification Errors
    if (err.name === 'JsonWebTokenError') {
        sendError(res, 'Invalid token provided', 401, 'INVALID_TOKEN');
        return;
    }
    if (err.name === 'TokenExpiredError') {
        sendError(res, 'Authentication token has expired', 401, 'TOKEN_EXPIRED');
        return;
    }
    // 5. Unhandled / Internal Server Error
    logger.error({ err, stack: err.stack }, '🚨 Unhandled Internal Error');
    sendError(res, 'Internal server error occurred', 500, 'INTERNAL_SERVER_ERROR');
};
export const notFoundHandler = (req, res) => {
    sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
};
