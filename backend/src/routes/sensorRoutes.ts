import { Router } from 'express';
import { receiveSensorReading, getLatestReading, simulateSensorTick } from '../controllers/sensorController';

const router = Router();

router.post('/readings', receiveSensorReading);
router.get('/latest', getLatestReading);
router.get('/simulate', simulateSensorTick);

export default router;
