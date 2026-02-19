import { create } from "zustand";
import {
  Notification,
  GetNotificationsParams,
} from "@/types/notification.types";
import { notificationService } from "@/api/services/notification.service";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: (params?: GetNotificationsParams) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (params?: GetNotificationsParams) => {
    try {
      set({ isLoading: true, error: null });
      const notifications = await notificationService.getNotifications(params);

      set({ notifications, isLoading: false });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al cargar notificaciones";
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await notificationService.getUnreadCount();
      set({ unreadCount });
    } catch {
      // silencioso — no bloquea la UI
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      // Actualiza localmente sin refetch
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al marcar notificación";
      set({ error: errorMessage });
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    const unread = notifications.filter((n) => !n.is_read);
    // Llama a cada una en paralelo
    await Promise.allSettled(
      unread.map((n) => notificationService.markAsRead(n.id)),
    );
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  clearError: () => set({ error: null }),
}));
