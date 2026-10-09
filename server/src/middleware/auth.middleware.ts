import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { UserRole } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token missing or invalid'));
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Authentication token is invalid or expired'));
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access denied. Requires one of the following roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
};
