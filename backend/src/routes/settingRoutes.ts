import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController';
import { optionalAuthenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuthenticate, getSettings);
router.put('/', optionalAuthenticate, requireRole('ADMIN'), updateSettings);

export default router;
