import React, { useEffect, useState, useCallback } from "react";
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
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { orderService } from "@/api/services/order.service";
import { Order, TypeStatus } from "@/types/order.types";

// ─── Configuración de estados ──────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

const STATUS_CONFIG: Record<TypeStatus, StatusConfig> = {
  created: { label: "Pendiente", color: "#F59E0B", bg: "#FEF3C7" },
  accepted: { label: "Aceptado", color: "#3B82F6", bg: "#DBEAFE" },
  on_the_way: { label: "En camino", color: "#8B5CF6", bg: "#EDE9FE" },
  in_service: { label: "En servicio", color: "#E53535", bg: "#FEE2E2" },
  done: { label: "Finalizado", color: "#10B981", bg: "#D1FAE5" },
  cancelled: { label: "Cancelado", color: "#6B7280", bg: "#F3F4F6" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTotal(total: number, currency: string): string {
  return `${currency} ${total.toFixed(2)}`;
}

function getServiceName(order: Order): string {
  if (!order.items_snapshot || order.items_snapshot.length === 0)
    return "Servicio";
  const main = order.items_snapshot.find((i) => i.kind === "service_base");
  return main?.name ?? order.items_snapshot[0].name;
}

// ─── Tarjeta de orden ──────────────────────────────────────────────────────────

const OrderCard: React.FC<{ order: Order; onPress: () => void }> = ({
  order,
  onPress,
}) => {
  const { colors } = useTheme();
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.created;
  const address = order.delivery_address_snapshot;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Header: badge de estado + total */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
        <Text style={[styles.totalText, { color: colors.primary }]}>
          {formatTotal(order.total_snapshot, order.currency)}
        </Text>
      </View>

      {/* Nombre del servicio */}
      <View style={styles.serviceRow}>
        <Text style={[styles.serviceName, { color: colors.text }]}>
          {getServiceName(order)}
        </Text>
        <Icon name="arrow-right" size={14} color={colors.textSecondary} />
      </View>

      {/* Fecha programada */}
      {order.scheduled_at && (
        <View style={styles.infoRow}>
          <Icon name="calendar" size={13} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {formatDate(order.scheduled_at)}
          </Text>
        </View>
      )}

      {/* Dirección */}
      {address && (
        <View style={styles.infoRow}>
          <Icon name="gps" size={13} color={colors.textSecondary} />
          <Text
            style={[styles.infoText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {address.address_line}
          </Text>
        </View>
      )}

      {/* Fecha de creación */}
      <Text style={[styles.createdAt, { color: colors.textSecondary }]}>
        Creado el {formatCreatedAt(order.created_at)}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Pantalla ──────────────────────────────────────────────────────────────────

export default function MyOrdersScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders();
      // Ordenar: más recientes primero
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setOrders(sorted);
    } catch (err) {
      console.error("[MyOrders] Error cargando órdenes:", err);
      setError("No se pudieron cargar tus pedidos.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders(true);
  }, [fetchOrders]);

  const handleOrderPress = (order: Order) => {
    router.push({
      pathname: "/(tabs)/(user)/(menu)/order-detail",
      params: { orderId: order.id },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title="Mis pedidos" />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando pedidos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader title="Mis pedidos" />

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          orders.length > 0 ? (
            <Text
              style={[styles.listSubtitle, { color: colors.textSecondary }]}
            >
              Historial y estado de todos tus servicios.
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Icon name="calendar" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {error ?? "Sin pedidos aún"}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {error
                ? "Desliza hacia abajo para reintentar"
                : "Cuando realices un servicio aparecerá aquí"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => handleOrderPress(item)} />
        )}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  listSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.sm,
  },

  // Card
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    includeFontPadding: false,
  },
  totalText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semibold,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  createdAt: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },

  // Empty / loading
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    minHeight: 400,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 20,
  },
});
