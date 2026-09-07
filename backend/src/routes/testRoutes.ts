import { Router } from 'express';
import { getTests, getTestById, createTest } from '../controllers/testController';
import { optionalAuthenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuthenticate, getTests);
router.get('/:id', optionalAuthenticate, getTestById);
router.post('/', optionalAuthenticate, requireRole('ADMIN', 'OPERATOR', 'QUALITY_OPERATOR'), createTest);

export default router;
