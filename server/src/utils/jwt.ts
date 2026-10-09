import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { CookieOptions } from 'express';
import { env } from '../config/env.js';
import { UserRole } from '../models/User.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRATION as jwt.SignOptions['expiresIn'],
    }
  );
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(
    { userId: payload.userId, tokenId: payload.tokenId || crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRATION as jwt.SignOptions['expiresIn'],
    }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

export const REFRESH_COOKIE_NAME = 'stockdrive_rt';

export const getRefreshCookieOptions = (): CookieOptions => {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};
