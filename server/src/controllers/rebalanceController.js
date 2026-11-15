import { z } from 'zod';
import { calculateRebalancePlan } from '../services/rebalancingService.js';

export const rebalanceQuerySchema = z.object({
  driftThreshold: z.coerce.number().min(1).max(25).default(5),
});

/**
 * GET /api/rebalance
 * Evaluates asset allocation, drift, required trades, SIP redirection, and tax impacts
 */
export async function getRebalancePlan(req, res, next) {
  try {
    const parse = rebalanceQuerySchema.safeParse(req.query);
    const driftThreshold = parse.success ? parse.data.driftThreshold : 5;

    const plan = await calculateRebalancePlan(req.user.id, driftThreshold);
    return res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
}
