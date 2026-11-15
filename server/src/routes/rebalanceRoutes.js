import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getRebalancePlan } from '../controllers/rebalanceController.js';

const router = Router();

router.use(protect);

router.get('/', getRebalancePlan);

export default router;
