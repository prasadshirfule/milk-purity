import { Router } from 'express';
import {
  getDevices,
  getDeviceById,
  deviceHeartbeat,
  registerDevice,
  updateDevice,
  deleteDevice,
  ingestTelemetry,
  getLatestTelemetry
} from '../controllers/deviceController';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuthenticate, getDevices);
router.get('/:id', optionalAuthenticate, getDeviceById);
router.post('/:id/heartbeat', deviceHeartbeat);
router.post('/:deviceId/telemetry', ingestTelemetry);
router.get('/:deviceId/telemetry/latest', optionalAuthenticate, getLatestTelemetry);

// Admin-only management
router.post('/', authenticate, requireRole('ADMIN'), registerDevice);
router.put('/:id', authenticate, requireRole('ADMIN'), updateDevice);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteDevice);

export default router;
