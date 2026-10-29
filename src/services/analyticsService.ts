import { apiClient } from "../lib/apiClient";
import type {
  PortfolioHealthData,
  SignalQualityData,
  AnalyticsOverviewData,
} from "../types";

export async function getPortfolioHealthApi(): Promise<PortfolioHealthData> {
  const response = await apiClient.get("/analytics/portfolio-health");
  return response.data?.data;
}

export async function getSignalQualityApi(): Promise<SignalQualityData> {
  const response = await apiClient.get("/analytics/signal-quality");
  return response.data?.data;
}

export async function getAnalyticsOverviewApi(): Promise<AnalyticsOverviewData> {
  const response = await apiClient.get("/analytics/overview");
  return response.data?.data;
}
