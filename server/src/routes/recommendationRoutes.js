import { Router } from 'express';
import {
  generateRecommendationController,
  getLatestRecommendationController,
  getRecommendationHistoryController,
  getRecommendationByIdController,
  compareRecommendationsController,
  archiveRecommendationController,
  deleteRecommendationController,
  recommendationHistoryQuerySchema,
} from '../controllers/recommendationController.js';
import { protect } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.post('/generate', generateRecommendationController);
router.get('/latest', getLatestRecommendationController);
router.get('/history', validateQuery(recommendationHistoryQuerySchema), getRecommendationHistoryController);
router.get('/compare/:id1/:id2', compareRecommendationsController);
router.get('/:id', getRecommendationByIdController);
router.put('/:id/archive', archiveRecommendationController);
router.delete('/:id', deleteRecommendationController);

export default router;
