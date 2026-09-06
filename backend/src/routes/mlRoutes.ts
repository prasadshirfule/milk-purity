import { Router } from 'express';
import { predictPurity } from '../controllers/mlController';

const router = Router();

router.post('/predict', predictPurity);

export default router;
