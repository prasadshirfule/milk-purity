import { Router } from 'express';
import { getAlerts, updateAlertStatus } from '../controllers/alertController';

const router = Router();

router.get('/', getAlerts);
router.put('/:id', updateAlertStatus);
router.patch('/:id', updateAlertStatus);

export default router;
