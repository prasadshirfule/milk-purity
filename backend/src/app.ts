import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import farmerRoutes from './routes/farmerRoutes';
import testRoutes from './routes/testRoutes';
import sensorRoutes from './routes/sensorRoutes';
import collectionRoutes from './routes/collectionRoutes';
import deviceRoutes from './routes/deviceRoutes';
import alertRoutes from './routes/alertRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import mlRoutes from './routes/mlRoutes';
import settingRoutes from './routes/settingRoutes';
import authRoutes from './routes/authRoutes';
import auditRoutes from './routes/auditRoutes';
import { errorHandler } from './middleware/errorHandler';
import { ENV } from './config/environment';
import { connectDatabase } from './config/db';
import { dataRepository } from './services/seedService';

let dbInitPromise: Promise<void> | null = null;
const ensureDbInitialized = async () => {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await connectDatabase();
      await dataRepository.seedDatabaseIfEmpty();
    })();
  }
  return dbInitPromise;
};

export const createApp = (): Application => {
  const app = express();

  // CORS configuration
  const defaultOrigins = [
    ENV.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:5000'
  ];
  const configuredOrigins = ENV.ALLOWED_ORIGINS 
    ? ENV.ALLOWED_ORIGINS.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];
  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, same-origin)
      if (!origin) {
        return callback(null, true);
      }
      // Allow matched or allowlisted origins, or any *.vercel.app deployment
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin === ENV.FRONTEND_URL
      ) {
        return callback(null, true);
      }
      // Reject unknown origins
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serverless / Lambda DB initialization middleware
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ensureDbInitialized();
    } catch (err) {
      // Graceful fallback to demo / in-memory mode
    }
    next();
  });

  // Health check
  app.get(['/api', '/api/health'], (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      system: 'MILKGUARD — Smart Milk Quality & Dairy Management API',
      timestamp: new Date().toISOString(),
      demoMode: ENV.DEMO_MODE,
      version: '1.0.0'
    });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/farmers', farmerRoutes);
  app.use('/api/customers', farmerRoutes); // customer code & lookup alias
  app.use('/api/tests', testRoutes);
  app.use('/api/sensors', sensorRoutes);
  app.use('/api/collections', collectionRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/summary', dashboardRoutes); // convenience alias
  app.use('/api/ml', mlRoutes);
  app.use('/api/settings', settingRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

