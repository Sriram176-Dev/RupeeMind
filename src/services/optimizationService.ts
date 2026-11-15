import { apiClient } from '../lib/apiClient';
import type { OptimizationResponse } from '../types';

/**
 * Fetches portfolio Mean-Variance efficient frontier and optimal allocations
 */
export async function getPortfolioOptimizationApi(
  riskBand?: string
): Promise<OptimizationResponse> {
  const url = riskBand ? `/optimize?riskBand=${encodeURIComponent(riskBand)}` : '/optimize';
  const response = await apiClient.get<{ success: boolean; data: OptimizationResponse }>(url);
  return response.data.data;
}
