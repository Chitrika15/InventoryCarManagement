import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/register', authRateLimiter, validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', (req, res, next) => {
    // If access token is present, we populate req.user, but still allow logout if expired
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        requireAuth(req, res, () => AuthController.logout(req, res, next));
    }
    else {
        AuthController.logout(req, res, next);
    }
});
router.get('/me', requireAuth, AuthController.me);
export const authRouter = router;
