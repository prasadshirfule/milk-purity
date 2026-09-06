import express, { Application, Request, Response } from 'express';
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
import { errorHandler } from './middleware/errorHandler';
import { ENV } from './config/environment';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      system: 'Milk Purity & Dairy Management API',
      timestamp: new Date().toISOString(),
      demoMode: ENV.DEMO_MODE,
      version: '1.0.0'
    });
  });

  // REST API Routes
  app.use('/api/farmers', farmerRoutes);
  app.use('/api/tests', testRoutes);
  app.use('/api/sensors', sensorRoutes);
  app.use('/api/collections', collectionRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/ml', mlRoutes);
  app.use('/api/settings', settingRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
