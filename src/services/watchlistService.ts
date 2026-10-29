import { apiClient } from "../lib/apiClient";

export async function getWatchlist(): Promise<string[]> {
  const response = await apiClient.get("/watchlist");
  if (response.data?.symbols && Array.isArray(response.data.symbols)) {
    return response.data.symbols;
  }
  return [];
}

export async function toggleWatchlist(
  symbol: string,
): Promise<{ symbol: string; inWatchlist: boolean; watchlist: string[] }> {
  const response = await apiClient.post(`/watchlist/${symbol}`);
  const { inWatchlist, watchlist, symbols } = response.data;
  return {
    symbol,
    inWatchlist,
    watchlist: watchlist ?? symbols ?? [],
  };
}
