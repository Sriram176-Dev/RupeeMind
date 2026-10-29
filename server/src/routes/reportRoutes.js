import { Router } from 'express';
import {
  getPortfolioAuditJsonController,
  getPortfolioAuditHtmlController,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/portfolio-audit', getPortfolioAuditJsonController);
router.get('/portfolio-audit/html', getPortfolioAuditHtmlController);

export default router;
