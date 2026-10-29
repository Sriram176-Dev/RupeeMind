import * as reportService from '../services/reportService.js';

export async function getPortfolioAuditJsonController(req, res, next) {
  try {
    const userId = req.user.id;
    const audit = await reportService.generateInstitutionalAudit(userId);
    return res.status(200).json({
      success: true,
      data: audit,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPortfolioAuditHtmlController(req, res, next) {
  try {
    const userId = req.user.id;
    const html = await reportService.generatePrintableHtmlReport(userId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
}
