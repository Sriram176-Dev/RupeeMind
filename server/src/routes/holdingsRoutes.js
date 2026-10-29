import { Router } from 'express';
import { getHoldings, addHolding, deleteHolding, createHoldingSchema } from '../controllers/holdingsController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getHoldings);
router.post('/', validate(createHoldingSchema), addHolding);
router.delete('/:id', deleteHolding);

export default router;
