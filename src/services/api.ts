export * from "./authService";
export * from "./profileService";
export * from "./marketService";
export * from "./portfolioService";
export * from "./watchlistService";
export {
  getRecommendations,
  getLatestRecommendationApi,
  generateRecommendationsApi,
  getRecommendationHistoryApi,
  getRecommendationByIdApi,
  compareRecommendationsApi,
  archiveRecommendationApi,
  deleteRecommendationApi,
} from "./recommendationService";
export * from "./analyticsService";
export * from "./paperTradingService";
export * from "./stressTestService";
export * from "./copilotService";
export * from "./reportService";
export * from "./taxService";
export * from "./rebalanceService";
export * from "./goalService";
export * from "./healthCheckService";
export * from "./alertService";
export * from "./backtestService";
export * from "./optimizationService";
export * from "./modelTransparencyService";

import { apiClient } from "../lib/apiClient";

export async function getSavedCalculations(): Promise<
  Array<Record<string, unknown>>
> {
  const response = await apiClient.get("/calculations");
  return Array.isArray(response.data?.calculations)
    ? response.data.calculations
    : [];
}

export async function saveCalculationApi(
  type: string,
  inputs: unknown,
  result: unknown,
): Promise<Record<string, unknown> | null> {
  const response = await apiClient.post("/calculations", {
    type,
    inputs,
    result,
  });
  return response.data?.calculation ?? null;
}
