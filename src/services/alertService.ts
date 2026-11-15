import { apiClient } from '../lib/apiClient';
import type {
  AlertItem,
  CreateAlertPayload,
  NotificationItem,
} from '../types';

/**
 * Fetches all user alerts with quota metadata
 */
export async function getAlertsApi(): Promise<{
  alerts: AlertItem[];
  meta: { total: number; active: number; paused: number; maxLimit: number };
}> {
  const response = await apiClient.get<{
    success: boolean;
    data: AlertItem[];
    meta: { total: number; active: number; paused: number; maxLimit: number };
  }>('/alerts');
  return {
    alerts: response.data.data,
    meta: response.data.meta,
  };
}

/**
 * Creates a new user alert
 */
export async function createAlertApi(payload: CreateAlertPayload): Promise<AlertItem> {
  const response = await apiClient.post<{ success: boolean; data: AlertItem }>(
    '/alerts',
    payload
  );
  return response.data.data;
}

/**
 * Updates an alert (e.g. pause, resume, adjust targets)
 */
export async function updateAlertApi(
  alertId: string,
  payload: Partial<CreateAlertPayload> & { status?: string }
): Promise<AlertItem> {
  const response = await apiClient.put<{ success: boolean; data: AlertItem }>(
    `/alerts/${alertId}`,
    payload
  );
  return response.data.data;
}

/**
 * Deletes an alert
 */
export async function deleteAlertApi(alertId: string): Promise<void> {
  await apiClient.delete(`/alerts/${alertId}`);
}

/**
 * Fetches alert notification trigger history
 */
export async function getAlertHistoryApi(limit: number = 50): Promise<NotificationItem[]> {
  const response = await apiClient.get<{ success: boolean; data: NotificationItem[] }>(
    `/alerts/history?limit=${limit}`
  );
  return response.data.data;
}

/**
 * Manually triggers evaluation of all active alerts for current user
 */
export async function evaluateAlertsNowApi(): Promise<{
  evaluatedCount: number;
  triggeredCount: number;
  results: any[];
}> {
  const response = await apiClient.post<{
    success: boolean;
    data: { evaluatedCount: number; triggeredCount: number; results: any[] };
    message: string;
  }>('/alerts/evaluate-now');
  return response.data.data;
}

/**
 * Fetches notifications with unread count
 */
export async function getNotificationsApi(unreadOnly: boolean = false): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  const response = await apiClient.get<{
    success: boolean;
    data: NotificationItem[];
    meta: { unreadCount: number; total: number };
  }>(`/notifications${unreadOnly ? '?unread=true' : ''}`);
  return {
    notifications: response.data.data,
    unreadCount: response.data.meta.unreadCount,
  };
}

/**
 * Marks single notification as read
 */
export async function markNotificationReadApi(id: string): Promise<void> {
  await apiClient.put(`/notifications/${id}/read`);
}

/**
 * Marks all notifications as read
 */
export async function markAllNotificationsReadApi(): Promise<void> {
  await apiClient.put('/notifications/read-all');
}

/**
 * Deletes a notification
 */
export async function deleteNotificationApi(id: string): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}
