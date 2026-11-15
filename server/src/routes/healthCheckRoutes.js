import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getInsuranceAndEmergencyAudit,
  updateInsuranceAuditSettings,
} from '../controllers/healthCheckController.js';

const router = Router();

router.use(protect);

router.get('/insurance-emergency', getInsuranceAndEmergencyAudit);
router.put('/insurance-emergency', updateInsuranceAuditSettings);

export default router;
