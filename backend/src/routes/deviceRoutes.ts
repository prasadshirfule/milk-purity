import { Router } from 'express';
import { getDevices, getDeviceById, deviceHeartbeat } from '../controllers/deviceController';

const router = Router();

router.get('/', getDevices);
router.get('/:id', getDeviceById);
router.post('/:id/heartbeat', deviceHeartbeat);

export default router;
