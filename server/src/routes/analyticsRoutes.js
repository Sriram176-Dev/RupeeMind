import { Router } from 'express';
import {
  getPortfolioHealthController,
  getSignalQualityController,
  getAnalyticsOverviewController,
  runStressTestController,
  getVaRMetricsController,
  runMonteCarloController,
  getScenariosListController,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/portfolio-health', getPortfolioHealthController);
router.get('/signal-quality', getSignalQualityController);
router.get('/overview', getAnalyticsOverviewController);
router.get('/scenarios', getScenariosListController);
router.post('/stress-test', runStressTestController);
router.get('/var-metrics', getVaRMetricsController);
router.post('/monte-carlo', runMonteCarloController);

export default router;
