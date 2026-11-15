import { apiClient } from '../lib/apiClient';
import type { BacktestParams, BacktestResponse } from '../types';

/**
 * Runs a backtest against real historical data
 */
export async function runBacktestApi(params: BacktestParams): Promise<BacktestResponse> {
  const response = await apiClient.post<{ success: boolean; data: BacktestResponse }>(
    '/backtest',
    params
  );
  return response.data.data;
}
