import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  simulateGoalSkip,
} from '../controllers/goalController.js';

const router = Router();

router.use(protect);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/simulate-skip', simulateGoalSkip);

export default router;
