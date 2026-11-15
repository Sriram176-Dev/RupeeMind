import { z } from 'zod';
import { calculateTaxReport, generateCapitalGainsCsv } from '../services/taxService.js';

export const taxReportQuerySchema = z.object({
  fy: z.string().optional(),
});

/**
 * GET /api/tax/capital-gains
 * Returns capital gains breakdown with FIFO lots, STCG, LTCG, and tax-harvesting suggestions
 */
export async function getCapitalGainsReport(req, res, next) {
  try {
    const parse = taxReportQuerySchema.safeParse(req.query);
    const filterFY = parse.success && parse.data.fy ? parse.data.fy : null;

    const report = await calculateTaxReport(req.user.id, filterFY);
    return res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tax/capital-gains/csv
 * Downloads capital gains report as a CSV file
 */
export async function exportCapitalGainsCsv(req, res, next) {
  try {
    const parse = taxReportQuerySchema.safeParse(req.query);
    const filterFY = parse.success && parse.data.fy ? parse.data.fy : null;

    const report = await calculateTaxReport(req.user.id, filterFY);
    const csvContent = generateCapitalGainsCsv(report);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="RupeeMind_CapitalGains_${report.selectedFinancialYear.replace(/\s+/g, '_')}.csv"`
    );
    return res.send(csvContent);
  } catch (error) {
    next(error);
  }
}
