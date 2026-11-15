import { apiClient } from '../lib/apiClient';
import type { InsuranceEmergencyAuditResponse } from '../types';

/**
 * Fetches the emergency fund and insurance health check evaluation
 */
export async function getInsuranceEmergencyAuditApi(): Promise<InsuranceEmergencyAuditResponse> {
  const response = await apiClient.get<{ success: boolean; data: InsuranceEmergencyAuditResponse }>(
    '/health-check/insurance-emergency'
  );
  return response.data.data;
}

/**
 * Updates insurance and emergency parameters
 */
export async function updateInsuranceSettingsApi(
  settings: Partial<{
    emergencyFundAmount: number;
    emergencyFundMonthsTarget: number;
    hasLifeInsurance: boolean;
    termInsuranceCover: number;
    hasHealthInsurance: boolean;
    healthInsuranceCover: number;
  }>
): Promise<InsuranceEmergencyAuditResponse> {
  const response = await apiClient.put<{ success: boolean; data: InsuranceEmergencyAuditResponse }>(
    '/health-check/insurance-emergency',
    settings
  );
  return response.data.data;
}
