import { Router } from 'express';
import { getProfile, updateProfile, updateProfileSchema } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getProfile);
router.put('/', validate(updateProfileSchema), updateProfile);

export default router;
