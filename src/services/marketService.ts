import { apiClient } from "../lib/apiClient";
import type {
  FundCategory,
  FundRiskLevel,
  FundRecommendationResponse,
  IndexData,
  MutualFund,
  NewsItem,
  PricePoint,
  SearchResultItem,
  SignalData,
  StockQuote,
  TimeRange,
  UserProfile,
} from "../types";

export async function getIndices(): Promise<IndexData[]> {
  const response = await apiClient.get("/market/indices");
  return response.data?.indices ?? response.data?.data ?? [];
}

export async function getQuotes(filters?: {
  search?: string;
  sector?: string;
  niftyFilter?: "all" | "nifty50" | "gainers" | "losers";
  sortBy?: "marketCap" | "changePercent" | "price" | "volume";
  sortOrder?: "asc" | "desc";
  symbols?: string[];
}): Promise<StockQuote[]> {
  const queryParams = new URLSearchParams();
  if (filters?.symbols && filters.symbols.length > 0) {
    queryParams.set("symbols", filters.symbols.join(","));
  }

  const url = `/market/quotes${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const response = await apiClient.get(url);
  let list: StockQuote[] = Array.isArray(response.data?.data)
    ? [...response.data.data]
    : [];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.sector.toLowerCase().includes(q),
    );
  }

  if (filters?.sector && filters.sector !== "All") {
    list = list.filter((item) =>
      item.sector.toLowerCase().includes(filters.sector!.toLowerCase()),
    );
  }

  if (filters?.niftyFilter === "gainers") {
    list = list
      .filter((item) => item.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
  } else if (filters?.niftyFilter === "losers") {
    list = list
      .filter((item) => item.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent);
  } else if (filters?.niftyFilter === "nifty50") {
    list = list.filter((item) => item.isNifty50);
  }

  if (
    filters?.sortBy &&
    filters.niftyFilter !== "gainers" &&
    filters.niftyFilter !== "losers"
  ) {
    const key = filters.sortBy;
    const direction = filters.sortOrder === "asc" ? 1 : -1;
    list.sort((a, b) => (a[key] > b[key] ? 1 : -1) * direction);
  }

  return list;
}

export async function getStockQuote(
  symbol: string,
): Promise<StockQuote | null> {
  const response = await apiClient.get(
    `/market/${encodeURIComponent(symbol)}/quote`,
  );
  return response.data?.data ?? null;
}

export async function getStockHistory(
  symbol: string,
  range: TimeRange,
): Promise<PricePoint[]> {
  const response = await apiClient.get(
    `/market/${encodeURIComponent(symbol)}/history?range=${range}`,
  );
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function getMarketStatusApi(): Promise<{
  isOpen: boolean;
} | null> {
  try {
    const response = await apiClient.get("/market/status");
    return response.data?.data ?? response.data ?? null;
  } catch {
    return null;
  }
}

export async function getSignal(symbol: string): Promise<SignalData> {
  const response = await apiClient.get(
    `/market/${encodeURIComponent(symbol)}/signal`,
  );
  if (response.data?.data) {
    return response.data.data;
  }
  throw new Error(`Failed to generate algorithmic signal for ${symbol}`);
}

export async function searchSymbols(
  query: string,
): Promise<SearchResultItem[]> {
  if (!query || query.trim().length === 0) return [];
  const response = await apiClient.get(
    `/market/search?q=${encodeURIComponent(query.trim())}`,
  );
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data.map((item: Record<string, unknown>) => ({
      symbol: String(item.symbol ?? "").replace(/\.(NS|BO)$/i, ""),
      name: String(item.name ?? item.companyName ?? item.symbol ?? ""),
      exchange: String(item.exchange ?? "NSE"),
      type: String(item.type ?? "EQUITY"),
    }));
  }
  return [];
}

export async function getFunds(filters?: {
  search?: string;
  category?: FundCategory | string | "All";
  riskLevel?: FundRiskLevel | string | "All";
  fundHouse?: string;
  min3YReturn?: number;
  sortBy?:
    | "cagr3Y"
    | "cagr1Y"
    | "cagr5Y"
    | "volatility"
    | "maxDrawdown"
    | "nav"
    | "sharpeRatio";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}): Promise<MutualFund[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.category && filters.category !== "All")
    params.set("category", filters.category);
  if (filters?.riskLevel && filters.riskLevel !== "All")
    params.set("riskLevel", filters.riskLevel);
  if (filters?.fundHouse && filters.fundHouse !== "All")
    params.set("fundHouse", filters.fundHouse);
  if (filters?.min3YReturn !== undefined)
    params.set("min3YReturn", filters.min3YReturn.toString());
  if (filters?.sortBy) params.set("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters?.page) params.set("page", filters.page.toString());
  if (filters?.limit) params.set("limit", filters.limit.toString());

  const response = await apiClient.get(`/funds?${params.toString()}`);
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function getFund(code: string): Promise<MutualFund | null> {
  const response = await apiClient.get(`/funds/${encodeURIComponent(code)}`);
  return response.data?.data ?? null;
}

export async function getFundByCode(code: string): Promise<MutualFund | null> {
  return getFund(code);
}

export async function compareFundsApi(codes: string[]): Promise<MutualFund[]> {
  const response = await apiClient.post("/funds/compare", { codes });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function getNews(
  category?: string,
  query?: string,
  fresh?: boolean,
): Promise<NewsItem[]> {
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (query) params.set("q", query);
  if (fresh) params.set("fresh", "true");

  const response = await apiClient.get(`/news?${params.toString()}`);
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function generateRecommendations(
  _profile?: UserProfile,
): Promise<FundRecommendationResponse> {
  const response = await apiClient.post("/recommendations/generate");
  if (response.data?.data) {
    const doc = response.data.data;
    return {
      profileSnapshot: doc.profileSnapshot,
      assetAllocation: doc.assetAllocation,
      recommendations: doc.recommendations.map(
        (item: Record<string, unknown>) => ({
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
          role: String(item.role ?? ""),
          rationale: String(item.rationale ?? ""),
        }),
      ),
      marketContextNote: doc.marketContextNote,
    };
  }
  throw new Error("Failed to generate real fund recommendations");
}
