import { Router } from 'express';
import { runBacktestController } from '../controllers/backtestController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', runBacktestController);
router.post('/', runBacktestController);

export default router;
