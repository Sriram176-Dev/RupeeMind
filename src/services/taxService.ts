import { apiClient } from '../lib/apiClient';
import type { TaxReportResponse } from '../types';

/**
 * Fetches capital gains report with FIFO lots, STCG/LTCG, and harvesting suggestions
 */
export async function getCapitalGainsReportApi(fy?: string): Promise<TaxReportResponse> {
  const url = fy ? `/tax/capital-gains?fy=${encodeURIComponent(fy)}` : '/tax/capital-gains';
  const response = await apiClient.get<{ success: boolean; data: TaxReportResponse }>(url);
  return response.data.data;
}

/**
 * Downloads the capital gains report as a CSV file in the browser
 */
export async function downloadCapitalGainsCsv(fy?: string): Promise<void> {
  const url = fy ? `/tax/capital-gains/csv?fy=${encodeURIComponent(fy)}` : '/tax/capital-gains/csv';
  const response = await apiClient.get<string>(url, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data as unknown as BlobPart], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `RupeeMind_CapitalGains_${(fy || 'Current').replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
