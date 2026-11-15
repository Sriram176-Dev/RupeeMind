import { z } from 'zod';
import { Goal } from '../models/Goal.js';
import {
  getUserGoalsWithProjections,
  simulateSkippedSips,
  calculateGoalProjections,
} from '../services/goalService.js';

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required'),
  category: z
    .enum([
      'Wealth creation',
      'Retirement',
      'Emergency fund',
      'House purchase',
      'Child education',
      'Vacation',
      'Vehicle purchase',
      'Wedding',
      'Other',
    ])
    .default('Wealth creation'),
  targetAmount: z.number().min(1000, 'Target amount must be at least ₹1,000'),
  currentAmount: z.number().min(0).default(0),
  horizonYears: z.number().min(1).max(50).default(5),
  priority: z.enum(['Critical', 'Important', 'Flexible']).default('Important'),
  monthlyContribution: z.number().min(0).default(0),
  expectedReturnRate: z.number().min(0.01).max(0.3).default(0.12),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(['ACTIVE', 'ACHIEVED', 'PAUSED']).optional(),
});

export const simulateSkipSchema = z.object({
  skipCount: z.coerce.number().min(1).max(24).default(1),
});

/**
 * GET /api/goals
 * Returns all goals with real-time projections and shortfall
 */
export async function getGoals(req, res, next) {
  try {
    const goals = await getUserGoalsWithProjections(req.user.id);
    return res.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/goals
 * Creates a new financial goal
 */
export async function createGoal(req, res, next) {
  try {
    const validated = createGoalSchema.parse(req.body);

    const goal = await Goal.create({
      userId: req.user.id,
      ...validated,
    });

    const projections = calculateGoalProjections(goal.toObject());

    return res.status(201).json({
      success: true,
      data: {
        ...goal.toObject(),
        projections,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/goals/:id
 * Updates an existing goal
 */
export async function updateGoal(req, res, next) {
  try {
    const validated = updateGoalSchema.parse(req.body);

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: validated },
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const projections = calculateGoalProjections(goal.toObject());

    return res.json({
      success: true,
      data: {
        ...goal.toObject(),
        projections,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/goals/:id
 * Removes a goal
 */
export async function deleteGoal(req, res, next) {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    return res.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/goals/:id/simulate-skip
 * Simulates skipping N monthly SIP installments for a goal
 */
export async function simulateGoalSkip(req, res, next) {
  try {
    const validated = simulateSkipSchema.parse(req.body);
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const simulation = simulateSkippedSips(goal.toObject(), validated.skipCount);

    return res.json({
      success: true,
      data: simulation,
    });
  } catch (error) {
    next(error);
  }
}
