import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
export const requireAuth = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Authentication token missing or invalid'));
    }
    const token = authHeader.substring(7).trim();
    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    }
    catch {
        next(new UnauthorizedError('Authentication token is invalid or expired'));
    }
};
export const requireRole = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ForbiddenError(`Access denied. Requires one of the following roles: ${roles.join(', ')}`));
        }
        next();
    };
};
