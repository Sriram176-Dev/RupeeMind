import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertHistory,
  evaluateUserAlertsNow,
} from '../controllers/alertController.js';

const router = Router();

router.use(protect);

router.get('/', getAlerts);
router.post('/', createAlert);
router.get('/history', getAlertHistory);
router.post('/evaluate-now', evaluateUserAlertsNow);
router.put('/:id', updateAlert);
router.delete('/:id', deleteAlert);

export default router;
