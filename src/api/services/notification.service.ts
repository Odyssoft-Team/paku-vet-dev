import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import {
  Notification,
  UnreadCountResponse,
  GetNotificationsParams,
} from "@/types/notification.types";

export const notificationService = {
  async getNotifications(
    params?: GetNotificationsParams,
  ): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>(
      API_ENDPOINTS.NOTIFICATIONS.LIST,
      {
        params: {
          unread_only: params?.unread_only ?? false,
          limit: params?.limit ?? 20,
        },
      },
    );
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>(
      API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
    );
    return response.data.unread_count;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },
};
