import { Router } from 'express';
import { getPortfolioOptimization } from '../controllers/optimizationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getPortfolioOptimization);

export default router;
