import { z } from 'zod';
import { optimizeUserPortfolio } from '../services/portfolioOptimizationService.js';

export const optimizeQuerySchema = z.object({
  riskBand: z.enum(['LOW', 'MODERATE_LOW', 'MODERATE', 'MODERATE_HIGH', 'HIGH']).optional(),
});

/**
 * Controller to fetch Mean-Variance efficient frontier and portfolio optimization
 */
export async function getPortfolioOptimization(req, res, next) {
  try {
    const parse = optimizeQuerySchema.safeParse(req.query);
    const riskBandOverride = parse.success ? parse.data.riskBand : undefined;
    const result = await optimizeUserPortfolio(req.user.id, riskBandOverride);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
