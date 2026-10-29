import { describe, it, expect } from 'vitest';
import * as reportService from '../src/services/reportService.js';

describe('Institutional Portfolio Audit & Report Generator', () => {
  const dummyUserId = '64b1f2e8f1c2d3a4b5c6d7e8';

  it('generates a full structured institutional audit dossier', async () => {
    const audit = await reportService.generateInstitutionalAudit(dummyUserId);
    expect(audit).toBeDefined();
    expect(audit.meta).toBeDefined();
    expect(audit.meta.auditId).toMatch(/^RPM-AUDIT-\d{4}-[A-F0-9]{6}$/);
    expect(audit.investor).toBeDefined();
    expect(audit.executiveSummary).toBeDefined();
    expect(audit.executiveSummary.totalCurrentValue).toBeGreaterThan(0);
    expect(audit.valueAtRisk).toBeDefined();
    expect(audit.stressTestSummary).toBeDefined();
    expect(audit.taxPlanning).toBeDefined();
    expect(audit.taxPlanning.ltcgExemptionApplied).toBe(125000);
    expect(audit.disclaimer).toContain('SEBI');
  });

  it('generates a clean print-ready HTML report with print styles and action triggers', async () => {
    const html = await reportService.generatePrintableHtmlReport(dummyUserId);
    expect(html).toBeDefined();
    expect(typeof html).toBe('string');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('RUPEEMIND');
    expect(html).toContain('window.print()');
    expect(html).toContain('@media print');
    expect(html).toContain('DISCLAIMER & SEBI COMPLIANCE DISCLOSURE');
  });
});
