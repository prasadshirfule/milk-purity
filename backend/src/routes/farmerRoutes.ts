import { Router } from 'express';
import { getFarmers, getFarmerById, getFarmerByCustomerCode, createFarmer, updateFarmer, deleteFarmer } from '../controllers/farmerController';

const router = Router();

router.get('/', getFarmers);
router.get('/code/:customerCode', getFarmerByCustomerCode);
router.get('/:id', getFarmerById);
router.post('/', createFarmer);
router.put('/:id', updateFarmer);
router.delete('/:id', deleteFarmer);

export default router;

