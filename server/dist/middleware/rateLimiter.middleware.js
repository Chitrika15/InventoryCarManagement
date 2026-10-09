import rateLimit from 'express-rate-limit';
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per windowMs for auth routes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        error: {
            message: 'Too many authentication attempts, please try again after 15 minutes.',
            code: 'TOO_MANY_REQUESTS',
        },
    },
});
