import { createApp } from './app';
import { ENV } from './config/environment';
import { connectDatabase } from './config/db';
import { dataRepository } from './services/seedService';

export const app = createApp();

const startServer = async () => {
  // Attempt database connection
  await connectDatabase();
  await dataRepository.seedDatabaseIfEmpty();

  const server = app.listen(ENV.PORT, () => {
    console.log(`
  🥛 ==================================================== 🥛
     MILK PURITY & DAIRY MANAGEMENT SYSTEM - BACKEND API
  🥛 ==================================================== 🥛
     📡 Server running on: http://localhost:${ENV.PORT}
     ⚙️  Environment:      ${ENV.NODE_ENV}
     🧪 Demo Mode:        ${ENV.DEMO_MODE ? 'ENABLED (Mock/Memory persistence active)' : 'DISABLED (Live Database)'}
     📱 ESP32 Ingestion:  POST /api/sensors/readings
     🤖 ML Service Endpoint: ${ENV.ML_SERVICE_URL}
  ========================================================
    `);
  });

  return server;
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Fatal Server Startup Error:', err);
  });
}

export default app;

