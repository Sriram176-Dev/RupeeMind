import { apiClient } from '../lib/apiClient';
import type {
  PaperTradingSummary,
  PaperOrder,
  PlaceOrderPayload,
  BrokerageCharges,
} from '../types';

export async function getPaperTradingSummaryApi(): Promise<PaperTradingSummary> {
  const response = await apiClient.get('/paper-trading/summary');
  return response.data?.data;
}

export async function getPaperOrdersApi(params?: {
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<{ orders: PaperOrder[]; total: number; limit: number; skip: number }> {
  const response = await apiClient.get('/paper-trading/orders', { params });
  return response.data?.data;
}

export async function placePaperOrderApi(
  payload: PlaceOrderPayload
): Promise<{ success: boolean; order: PaperOrder; status: string; message: string }> {
  const response = await apiClient.post('/paper-trading/order', payload);
  return response.data?.data;
}

export async function cancelPaperOrderApi(orderId: string): Promise<{ success: boolean; orderId: string }> {
  const response = await apiClient.post(`/paper-trading/order/${orderId}/cancel`);
  return response.data?.data;
}

export async function resetPaperWalletApi(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post('/paper-trading/reset');
  return response.data?.data;
}

export async function estimateChargesApi(payload: {
  symbol?: string;
  transactionType: 'BUY' | 'SELL';
  productType: 'DELIVERY' | 'INTRADAY';
  quantity: number;
  price?: number;
}): Promise<{ charges: BrokerageCharges; price: number }> {
  const response = await apiClient.post('/paper-trading/estimate-charges', payload);
  return response.data?.data;
}
