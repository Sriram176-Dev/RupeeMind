import { Router } from 'express';
import {
  chatController,
  getSessionController,
  clearSessionController,
  getContextSummaryController,
} from '../controllers/copilotController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/chat', chatController);
router.get('/session', getSessionController);
router.delete('/session', clearSessionController);
router.get('/context', getContextSummaryController);

export default router;
