import { apiClient } from "../lib/apiClient";
import type { Holding, TrackedSIP } from "../types";

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
