import { Router } from 'express';
import { getModelTransparencyReport } from '../controllers/modelTransparencyController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getModelTransparencyReport);

export default router;
