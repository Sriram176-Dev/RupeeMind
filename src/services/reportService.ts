import { apiClient } from '../lib/apiClient';
import type { InstitutionalAuditDossier } from '../types';

export async function getPortfolioAuditJsonApi(): Promise<InstitutionalAuditDossier> {
  const res = await apiClient.get<{ success: boolean; data: InstitutionalAuditDossier }>(
    '/reports/portfolio-audit'
  );
  return res.data.data;
}

export function openPrintableAuditReport(): void {
  // Opens the server-rendered print-ready HTML report in a new tab
  const token = localStorage.getItem('token') || '';
  const url = `/api/reports/portfolio-audit/html${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  window.open(url, '_blank');
}

export const reportService = {
  getPortfolioAudit: getPortfolioAuditJsonApi,
  openPrintableAuditReport,
};

export default reportService;
