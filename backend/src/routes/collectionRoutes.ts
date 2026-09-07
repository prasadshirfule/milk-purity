import { Router } from 'express';
import { getCollections, createCollection } from '../controllers/collectionController';
import { optionalAuthenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuthenticate, getCollections);
router.post('/', optionalAuthenticate, requireRole('ADMIN', 'OPERATOR'), createCollection);

export default router;
