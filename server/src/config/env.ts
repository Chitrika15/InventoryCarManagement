import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/stockdrive_ims'),
  JWT_ACCESS_SECRET: z.string().default('stockdrive_jwt_access_super_secret_key_2026'),
  JWT_REFRESH_SECRET: z.string().default('stockdrive_jwt_refresh_super_secret_key_2026'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  COOKIE_SECRET: z.string().default('stockdrive_cookie_secret_key_2026'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
