import { Router } from 'express';
import { getCalculations, saveCalculation, saveCalculationSchema } from '../controllers/calculationController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getCalculations);
router.post('/', validate(saveCalculationSchema), saveCalculation);

export default router;
