import { Router } from 'express';
import { getAlerts, updateAlertStatus } from '../controllers/alertController';

const router = Router();

router.get('/', getAlerts);
router.put('/:id', updateAlertStatus);

export default router;
