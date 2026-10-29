import { apiClient } from "../lib/apiClient";
import type { NotificationItem, UserPreferences, PriceThresholdConfig } from "../types";

export async function getNotificationsApi(params?: {
  type?: string;
  read?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
  pagination?: { total: number; page: number; limit: number; pages: number };
}> {
  const response = await apiClient.get("/notifications", { params });
  if (
    response.data?.notifications &&
    Array.isArray(response.data.notifications)
  ) {
    const items: NotificationItem[] = response.data.notifications.map(
      (notification: Record<string, any>) => ({
        id: String(notification._id ?? notification.id ?? ""),
        _id: String(notification._id ?? notification.id ?? ""),
        type: notification.type ?? "system",
        severity: notification.severity ?? "info",
        title: String(notification.title ?? ""),
        body: String(notification.body ?? ""),
        meta: notification.meta ?? undefined,
        read: Boolean(notification.read),
        createdAt: String(notification.createdAt ?? new Date().toISOString()),
      })
    );

    return {
      notifications: items,
      unreadCount: Number(
        response.data.unreadCount ?? items.filter((item) => !item.read).length
      ),
      pagination: response.data.pagination,
    };
  }

  return { notifications: [], unreadCount: 0 };
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const response = await getNotificationsApi();
  return response.notifications;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await getNotificationsApi();
  return response.unreadCount;
}

export async function markNotificationRead(
  id: string
): Promise<{ success: boolean }> {
  const response = await apiClient.put(`/notifications/${id}/read`);
  return response.data;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await apiClient.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await apiClient.put("/notifications/read-all");
}

export async function deleteNotificationApi(id: string): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}

export async function getNotificationPreferencesApi(): Promise<UserPreferences> {
  const response = await apiClient.get("/notifications/preferences");
  return response.data?.preferences || {};
}

export async function updateNotificationPreferencesApi(
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const response = await apiClient.put("/notifications/preferences", preferences);
  return response.data?.preferences || {};
}

export async function setPriceThresholdApi(
  symbol: string,
  upper: number | null,
  lower: number | null,
  active = true
): Promise<{ success: boolean; threshold: PriceThresholdConfig }> {
  const response = await apiClient.post("/notifications/preferences/threshold", {
    symbol,
    upper,
    lower,
    active,
  });
  return response.data;
}

export async function deletePriceThresholdApi(symbol: string): Promise<void> {
  await apiClient.delete(`/notifications/preferences/threshold/${symbol}`);
}
