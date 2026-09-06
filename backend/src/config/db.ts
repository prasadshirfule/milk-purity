import mongoose from 'mongoose';
import { ENV } from './environment';

let isConnected = false;

export const connectDatabase = async (): Promise<boolean> => {
  if (ENV.DEMO_MODE) {
    console.log('ℹ️  Running in DEMO_MODE=true. Operating with in-memory fast mock persistence.');
    return false;
  }

  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️  MongoDB Connection Warning: ${error?.message || error}. Falling back to in-memory demo data.`);
    isConnected = false;
    return false;
  }
};

export const getDbConnectionStatus = (): boolean => isConnected;
