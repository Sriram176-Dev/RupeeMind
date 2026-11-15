import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getCapitalGainsReport, exportCapitalGainsCsv } from '../controllers/taxController.js';

const router = Router();

router.use(protect);

router.get('/capital-gains', getCapitalGainsReport);
router.get('/capital-gains/csv', exportCapitalGainsCsv);

export default router;
