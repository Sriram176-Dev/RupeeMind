import { Router } from 'express';
import {
  getFundsController,
  getFundDetailController,
  compareFundsController,
  compareFundsSchema,
  getFundsQuerySchema,
} from '../controllers/fundController.js';
import { validate, validateQuery } from '../middleware/validate.js';

const router = Router();

router.get('/', validateQuery(getFundsQuerySchema), getFundsController);
router.post('/compare', validate(compareFundsSchema), compareFundsController);
router.get('/:code', getFundDetailController);

export default router;
