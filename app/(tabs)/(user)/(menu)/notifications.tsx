import React, { useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useNotificationStore } from "@/store/notificationStore";
import { Notification } from "@/types/notification.types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs} h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Mapea el tipo de notificación a un icono y color de acento
const getNotificationMeta = (
  type: string,
  colors: any,
): { icon: string; accentColor: string; actionLabel?: string } => {
  switch (type) {
    case "payment_success":
      return { icon: "check", accentColor: colors.success || "#22C55E" };
    case "appointment_scheduled":
    case "appointment_confirmed":
      return {
        icon: "calendar",
        accentColor: colors.primary,
        actionLabel: "Rastrear",
      };
    case "service_review":
    case "service_alert":
      return {
        icon: "notification",
        accentColor: "#F59E0B",
        actionLabel: "Ver estado",
      };
    case "promo":
    case "coming_soon":
      return { icon: "happy", accentColor: colors.secondary || "#8B5CF6" };
    default:
      return { icon: "notification", accentColor: colors.primary };
  }
};

// ─── Notification Item ─────────────────────────────────────────────────────────

interface NotificationItemProps {
  item: Notification;
  onPress: (item: Notification) => void;
  colors: any;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onPress,
  colors,
}) => {
  const meta = getNotificationMeta(item.type, colors);

  const s = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
      ...Shadows.sm,
      // Notificaciones no leídas tienen borde izquierdo de acento
      borderLeftWidth: item.is_read ? 0 : 3,
      borderLeftColor: item.is_read ? "transparent" : meta.accentColor,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: meta.accentColor + "18",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    content: { flex: 1 },
    title: {
      fontSize: Typography.fontSize.sm,
      fontFamily: item.is_read
        ? Typography.fontFamily.regular
        : Typography.fontFamily.semibold,
      color: meta.accentColor,
      marginBottom: 2,
    },
    body: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      lineHeight: 20,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: Spacing.xs,
    },
    time: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
    },
    actionBtn: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: 6,
      paddingHorizontal: Spacing.md,
    },
    actionBtnText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFF",
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: meta.accentColor,
      marginTop: 6,
    },
  });

  return (
    <TouchableOpacity
      style={s.container}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Icono */}
      <View style={s.iconWrapper}>
        <Icon name={meta.icon as any} size={18} color={meta.accentColor} />
      </View>

      {/* Contenido */}
      <View style={s.content}>
        <Text style={s.title}>{item.title}</Text>
        <Text style={s.body}>{item.body}</Text>
        <View style={s.footer}>
          <Text style={s.time}>{formatRelativeTime(item.created_at)}</Text>
          {meta.actionLabel && (
            <TouchableOpacity style={s.actionBtn} onPress={() => onPress(item)}>
              <Text style={s.actionBtnText}>{meta.actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Punto indicador de no leído */}
      {!item.is_read && <View style={s.unreadDot} />}
    </TouchableOpacity>
  );
};

// ─── Empty State ───────────────────────────────────────────────────────────────

const EmptyState = ({ colors }: { colors: any }) => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      paddingHorizontal: Spacing.xl,
    }}
  >
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primary + "15",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md,
      }}
    >
      <Icon name="notification" size={32} color={colors.primary} />
    </View>
    <Text
      style={{
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.semibold,
        color: colors.text,
        textAlign: "center",
        marginBottom: Spacing.xs,
      }}
    >
      Sin notificaciones
    </Text>
    <Text
      style={{
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
        color: colors.textSecondary,
        textAlign: "center",
      }}
    >
      Aquí aparecerán tus alertas, confirmaciones y novedades de PAKU.
    </Text>
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const handlePressNotification = useCallback(
    async (item: Notification) => {
      if (!item.is_read) {
        await markAsRead(item.id);
      }
      // TODO: navegar según item.type / item.data cuando estén las rutas
    },
    [markAsRead],
  );

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    backBtn: { padding: Spacing.sm, width: 40 },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFF",
      textAlign: "center",
    },
    markAllBtn: {
      padding: Spacing.sm,
      width: 40,
      alignItems: "flex-end",
    },
    markAllText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.medium,
      color: "#FFFFFF99",
    },
    listContent: {
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    unreadBanner: {
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    unreadText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.medium,
      color: colors.textSecondary,
    },
    unreadBadge: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    unreadBadgeText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFF",
    },
  });

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.push("/(tabs)/(user)/")}
        >
          <Icon name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notificaciones</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity style={s.markAllBtn} onPress={markAllAsRead}>
            <Text style={s.markAllText}>Leer{"\n"}todo</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
      </View>

      {/* Loading inicial */}
      {isLoading && notifications.length === 0 ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={handlePressNotification}
              colors={colors}
            />
          )}
          contentContainerStyle={[
            s.listContent,
            notifications.length === 0 && { flex: 1 },
          ]}
          ListHeaderComponent={
            unreadCount > 0 ? (
              <View style={s.unreadBanner}>
                <Text style={s.unreadText}>Notificaciones sin leer</Text>
                <View style={s.unreadBadge}>
                  <Text style={s.unreadBadgeText}>{unreadCount}</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={<EmptyState colors={colors} />}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
