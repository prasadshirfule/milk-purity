import { Router } from 'express';
import { getFarmers, getFarmerById, getFarmerByCustomerCode, createFarmer, updateFarmer, deleteFarmer } from '../controllers/farmerController';
import { optionalAuthenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuthenticate, getFarmers);
router.get('/code/:customerCode', optionalAuthenticate, getFarmerByCustomerCode);
router.get('/:id', optionalAuthenticate, getFarmerById);
router.post('/', optionalAuthenticate, requireRole('ADMIN', 'OPERATOR'), createFarmer);
router.put('/:id', optionalAuthenticate, requireRole('ADMIN', 'OPERATOR'), updateFarmer);
router.delete('/:id', optionalAuthenticate, requireRole('ADMIN'), deleteFarmer);

export default router;

