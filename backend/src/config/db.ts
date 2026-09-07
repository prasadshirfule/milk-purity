import mongoose from 'mongoose';
import { ENV } from './environment';

let isConnected = false;
let connectionPromise: Promise<boolean> | null = null;

export const connectDatabase = async (): Promise<boolean> => {
  if (ENV.DEMO_MODE) {
    return false;
  }

  // If already connected in this process / container
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  // If connection is already in progress, await the existing promise
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const conn = await mongoose.connect(ENV.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });
      isConnected = true;
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return true;
    } catch (error: any) {
      console.warn(`⚠️  MongoDB Connection Warning: ${error?.message || error}. Falling back to in-memory demo data.`);
      isConnected = false;
      return false;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};

export const getDbConnectionStatus = (): boolean => isConnected || mongoose.connection.readyState === 1;

