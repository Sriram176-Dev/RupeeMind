import { apiClient } from "../lib/apiClient";
import type {
  Holding,
  TrackedSIP,
  Transaction,
  ImportPreviewItem,
  ImportParsePreview,
  BenchmarkComparisonResponse,
  PerformanceSummary,
} from "../types";

export async function getHoldings(): Promise<Holding[]> {
  const response = await apiClient.get("/holdings");
  return response.data?.holdings ?? [];
}

export async function addHolding(payload: {
  type: "STOCK" | "MUTUAL_FUND";
  symbolOrCode: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  buyDate: string;
  categoryOrSector: string;
}): Promise<Holding[]> {
  const response = await apiClient.post("/holdings", payload);
  return response.data?.holdings ?? [];
}

export async function deleteHolding(id: string): Promise<Holding[]> {
  const response = await apiClient.delete(`/holdings/${id}`);
  return response.data?.holdings ?? [];
}

export async function getTrackedSIPs(): Promise<TrackedSIP[]> {
  const response = await apiClient.get("/sips");
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return response.data?.sips ?? [];
}

export async function addTrackedSIP(payload: {
  fundCode: string;
  fundName?: string;
  amount: number;
  frequency?: "Monthly" | "Weekly" | "Quarterly";
  startDate?: string;
}): Promise<TrackedSIP[]> {
  await apiClient.post("/sips", payload);
  return getTrackedSIPs();
}

export async function deleteTrackedSIP(id: string): Promise<TrackedSIP[]> {
  await apiClient.delete(`/sips/${id}`);
  return getTrackedSIPs();
}

// ── Portfolio Import & Transaction APIs ───────────────────────────────

export async function parseImportFileApi(
  file: File,
  password?: string
): Promise<ImportParsePreview> {
  const formData = new FormData();
  formData.append("file", file);
  if (password) {
    formData.append("password", password);
  }

  const response = await apiClient.post("/holdings/import/parse", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data?.preview;
}

export async function confirmImportApi(
  transactions: ImportPreviewItem[]
): Promise<{ success: boolean; message: string; holdings: Holding[] }> {
  const response = await apiClient.post("/holdings/import/confirm", {
    transactions,
  });
  return response.data;
}

export async function getTransactionsApi(filter?: {
  holdingId?: string;
  type?: string;
}): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filter?.holdingId) params.set("holdingId", filter.holdingId);
  if (filter?.type) params.set("type", filter.type);

  const response = await apiClient.get(`/holdings/transactions?${params.toString()}`);
  return response.data?.transactions ?? [];
}

export async function deleteTransactionApi(id: string): Promise<void> {
  await apiClient.delete(`/holdings/transactions/${id}`);
}

export async function getPerformanceWithXirrApi(): Promise<{
  summary: PerformanceSummary;
  holdings: Holding[];
}> {
  const response = await apiClient.get("/holdings/performance");
  return (
    response.data ?? {
      summary: {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalGain: 0,
        absoluteReturn: 0,
        cagr: 0,
        xirr: null,
      },
      holdings: [],
    }
  );
}

export async function getBenchmarkComparisonApi(): Promise<BenchmarkComparisonResponse> {
  const response = await apiClient.get("/holdings/benchmark");
  return (
    response.data?.benchmark ?? {
      hasData: false,
      portfolioXirr: null,
      niftyXirr: null,
      alpha: null,
      portfolioCurrentValue: 0,
      niftySimulatedValue: 0,
      totalInvested: 0,
      totalGain: 0,
      niftyGain: 0,
      growthCurve: [],
    }
  );
}
