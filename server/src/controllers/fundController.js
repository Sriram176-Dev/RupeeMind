import { z } from 'zod';
import * as fundService from '../services/fundService.js';

export const compareFundsSchema = z.object({
  codes: z
    .array(z.string().min(1).max(50))
    .min(1, 'At least one fund code is required')
    .max(3, 'Cannot compare more than 3 funds at a time'),
});

export const getFundsQuerySchema = z.object({
  category: z.string().max(50).optional(),
  riskLevel: z.string().max(50).optional(),
  search: z.string().max(50).optional(),
  q: z.string().max(50).optional(),
  fundHouse: z.string().max(100).optional(),
  min3YReturn: z.coerce.number().optional(),
  sortBy: z.enum(['cagr3Y', 'cagr1Y', 'cagr5Y', 'aum', 'nav', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * GET /api/funds
 * Filter by category, riskLevel, search query, min3YReturn, sorting & pagination
 */
export async function getFundsController(req, res, next) {
  try {
    const { category, riskLevel, search, q, fundHouse, min3YReturn, sortBy, sortOrder, page, limit } = req.query;

    const result = await fundService.getFundsList({
      category,
      riskLevel,
      search: search || q,
      fundHouse,
      min3YReturn: min3YReturn ? parseFloat(min3YReturn) : undefined,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/funds/:code
 * Fetch single fund by schemeCode or slug
 */
export async function getFundDetailController(req, res, next) {
  try {
    const code = (req.params.code || '').trim();
    if (!code || code.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fund code',
      });
    }

    const fund = await fundService.getFundByCode(code);

    if (!fund) {
      return res.status(404).json({
        success: false,
        message: `Mutual fund not found for code: ${code}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: fund,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/funds/compare
 * Body: { codes: string[] } (max 3)
 */
export async function compareFundsController(req, res, next) {
  try {
    const codes = Array.isArray(req.body.codes) ? req.body.codes.slice(0, 3) : [];
    const funds = await fundService.compareFunds(codes);

    return res.status(200).json({
      success: true,
      data: funds,
      count: funds.length,
    });
  } catch (err) {
    next(err);
  }
}
