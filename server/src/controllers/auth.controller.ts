import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
} from '../utils/jwt.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const result = await AuthService.refreshTokens(rawRefreshToken);
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      await AuthService.logout(userId);
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        path: '/',
      });
      sendSuccess(res, { message: 'Successfully logged out' });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getCurrentUser(userId);
      sendSuccess(res, {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
