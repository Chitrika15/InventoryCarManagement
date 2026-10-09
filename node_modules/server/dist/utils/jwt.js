import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
export const generateAccessToken = (payload) => {
    return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRATION,
    });
};
export const generateRefreshToken = (payload) => {
    return jwt.sign({ userId: payload.userId, tokenId: payload.tokenId || crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRATION,
    });
};
export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
};
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
export const REFRESH_COOKIE_NAME = 'stockdrive_rt';
export const getRefreshCookieOptions = () => {
    const isProd = env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    };
};
