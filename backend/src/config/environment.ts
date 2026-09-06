import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' && process.env.DEMO_MODE === 'false';

if (isProduction) {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production mode');
  }
  if (!process.env.ESP32_API_KEY) {
    throw new Error('FATAL: ESP32_API_KEY environment variable is required in production mode');
  }
}

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEMO_MODE: process.env.DEMO_MODE !== 'false', // Default to true for foolproof out-of-the-box operation
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/milk_purity_db',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  JWT_SECRET: process.env.JWT_SECRET || 'demo_jwt_secret_token_dev_only_2026',
  ESP32_API_KEY: process.env.ESP32_API_KEY || 'demo_esp32_api_key_dev_only_2026',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || ''
};
