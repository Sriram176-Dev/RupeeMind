import { apiClient } from '../lib/apiClient';
import type { RebalancePlanResponse } from '../types';

/**
 * Fetches portfolio rebalance plan, target comparison, drift, and trade recommendations
 */
export async function getRebalancePlanApi(driftThreshold: number = 5): Promise<RebalancePlanResponse> {
  const response = await apiClient.get<{ success: boolean; data: RebalancePlanResponse }>(
    `/rebalance?driftThreshold=${driftThreshold}`
  );
  return response.data.data;
}
