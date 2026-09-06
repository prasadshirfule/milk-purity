import { Router } from 'express';
import { getCollections, createCollection } from '../controllers/collectionController';

const router = Router();

router.get('/', getCollections);
router.post('/', createCollection);

export default router;
