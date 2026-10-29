import { apiClient } from "../lib/apiClient";
import type {
  FundRecommendationResponse,
  RecommendationComparison,
} from "../types";

export type RecommendationSummary = {
  recommendations?: Array<Record<string, unknown>>;
  message?: string;
};

function formatDoc(doc: Record<string, any>): FundRecommendationResponse {
  return {
    _id: doc._id || doc.id,
    id: doc._id || doc.id,
    profileSnapshot: doc.profileSnapshot,
    assetAllocation: doc.assetAllocation,
    confidenceScore: doc.confidenceScore ?? 85,
    aiReasoning: doc.aiReasoning,
    holdingsSnapshot: doc.holdingsSnapshot || [],
    status: doc.status || 'active',
    createdAt: doc.createdAt,
    generatedAt: doc.generatedAt || doc.createdAt,
    recommendations: (doc.recommendations || []).map(
      (item: Record<string, any>) => ({
        rank: Number(item.rank ?? 0),
        fund: {
          code: String(item.fundCode ?? item.schemeCode ?? ""),
          schemeCode: String(item.schemeCode ?? ""),
          name: String(item.fundName ?? ""),
          fundHouse: String(item.fundHouse ?? ""),
          category: String(item.category ?? ""),
          riskLevel: String(item.riskLevel ?? ""),
          nav: Number(item.nav ?? 0),
          cagr1Y: null,
          cagr3Y: Number(item.cagr3Y ?? 0),
          cagr5Y: Number(item.cagr5Y ?? 0),
          volatility: null,
          maxDrawdown: null,
          expenseRatio: null,
          aum: null,
          navHistory: [],
        },
        allocationPercent: Number(item.allocationPercent ?? 0),
        role: item.role ?? "Core Wealth Builder",
        rationale: String(item.rationale ?? ""),
      })
    ),
    marketContextNote: doc.marketContextNote || "",
  };
}

export async function generateRecommendations(): Promise<RecommendationSummary> {
  const response = await apiClient.post("/recommendations/generate");
  return response.data ?? { recommendations: [] };
}

export async function generateRecommendationsApi(): Promise<FundRecommendationResponse> {
  const response = await apiClient.post("/recommendations/generate");
  if (response.data?.data) {
    return formatDoc(response.data.data);
  }
  throw new Error(response.data?.message || "Failed to generate recommendations");
}

export async function getRecommendations(): Promise<RecommendationSummary> {
  const response = await apiClient.get("/recommendations/latest");
  return response.data ?? { recommendations: [] };
}

export async function getLatestRecommendationApi(): Promise<FundRecommendationResponse | null> {
  try {
    const response = await apiClient.get("/recommendations/latest");
    if (response.data?.data) {
      return formatDoc(response.data.data);
    }
  } catch {
    // ignore backend unavailability
  }
  return null;
}

export async function getRecommendationHistoryApi(params?: {
  status?: string;
  limit?: number;
  page?: number;
}): Promise<{
  items: FundRecommendationResponse[];
  pagination: { total: number; page: number; limit: number; pages: number };
}> {
  const response = await apiClient.get("/recommendations/history", { params });
  const data = response.data?.data;
  return {
    items: (data?.items || []).map(formatDoc),
    pagination: data?.pagination || { total: 0, page: 1, limit: 20, pages: 0 },
  };
}

export async function getRecommendationByIdApi(
  id: string
): Promise<FundRecommendationResponse> {
  const response = await apiClient.get(`/recommendations/${id}`);
  return formatDoc(response.data.data);
}

export async function compareRecommendationsApi(
  id1: string,
  id2: string
): Promise<RecommendationComparison> {
  const response = await apiClient.get(`/recommendations/compare/${id1}/${id2}`);
  return response.data.data;
}

export async function archiveRecommendationApi(
  id: string
): Promise<FundRecommendationResponse> {
  const response = await apiClient.put(`/recommendations/${id}/archive`);
  return formatDoc(response.data.data);
}

export async function deleteRecommendationApi(
  id: string
): Promise<{ success: boolean; deletedId: string }> {
  const response = await apiClient.delete(`/recommendations/${id}`);
  return response.data;
}
