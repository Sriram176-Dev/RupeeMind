import { apiClient } from '../lib/apiClient';
import type { ModelTransparencyReport } from '../types';

/**
 * Fetches the validated ML signal model transparency report
 */
export async function getModelTransparencyReportApi(): Promise<ModelTransparencyReport> {
  const response = await apiClient.get<{ success: boolean; data: ModelTransparencyReport }>(
    '/model-transparency'
  );
  return response.data.data;
}
