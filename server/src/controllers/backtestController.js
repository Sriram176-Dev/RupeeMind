import { z } from 'zod';
import { runBacktest } from '../services/backtestService.js';

export const backtestSchema = z.object({
  symbol: z.string().default('^NSEI'),
  strategy: z
    .enum(['SIP_VS_LUMPSUM', 'SMA_CROSSOVER', 'BUY_AND_HOLD'])
    .default('SMA_CROSSOVER'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  initialCapital: z.coerce.number().min(1000).default(100000),
  monthlySipAmount: z.coerce.number().min(500).default(10000),
  fastPeriod: z.coerce.number().min(3).max(100).default(20),
  slowPeriod: z.coerce.number().min(10).max(300).default(50),
  transactionCostPercent: z.coerce.number().min(0).max(5).default(0.1),
  stcgTaxPercent: z.coerce.number().min(0).max(50).default(20.0),
  ltcgTaxPercent: z.coerce.number().min(0).max(50).default(12.5),
});

/**
 * Controller to execute backtest strategy
 */
export async function runBacktestController(req, res, next) {
  try {
    const raw = req.method === 'POST' ? req.body : req.query;
    const parsed = backtestSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(', '),
      });
    }

    const result = await runBacktest(parsed.data);
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
