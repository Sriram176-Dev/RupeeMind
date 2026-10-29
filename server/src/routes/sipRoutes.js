import { Router } from 'express';
import {
  getTrackedSIPs,
  addTrackedSIP,
  deleteTrackedSIP,
  createSipSchema,
} from '../controllers/sipController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getTrackedSIPs);
router.post('/', validate(createSipSchema), addTrackedSIP);
router.delete('/:id', deleteTrackedSIP);

export default router;
