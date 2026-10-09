import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDB = async (uri?: string): Promise<typeof mongoose> => {
  const mongoUri = uri || env.MONGO_URI;

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error({ error }, '❌ MongoDB connection error');
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error({ err }, 'MongoDB runtime error');
});
