import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEMO_MODE: process.env.DEMO_MODE !== 'false', // Default to true for foolproof out-of-the-box operation
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/milk_purity_db',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  JWT_SECRET: process.env.JWT_SECRET || 'amrit_dairy_jwt_secret_token_default_2026',
  ESP32_API_KEY: process.env.ESP32_API_KEY || 'esp32_milk_analyzer_secret_token_2026'
};
