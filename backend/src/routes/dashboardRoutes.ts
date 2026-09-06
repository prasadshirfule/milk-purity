import { Router } from 'express';
import { getDashboardSummary, getCollectionTrend, getQualityAnalytics } from '../controllers/dashboardController';

const router = Router();

router.get('/summary', getDashboardSummary);
router.get('/collection', getCollectionTrend);
router.get('/quality', getQualityAnalytics);

export default router;
