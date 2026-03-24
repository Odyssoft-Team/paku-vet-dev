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
import { groomerService } from "@/api/services/groomer.service";
import { Order } from "@/types/order.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTotal(total: number, currency: string): string {
  return `${currency} ${(total / 100).toFixed(2)}`;
}

// ─── Componente de tarjeta de orden ───────────────────────────────────────────

const OrderCard: React.FC<{ order: Order; onPress: () => void }> = ({
  order,
  onPress,
}) => {
  const { colors } = useTheme();
  const address = order.delivery_address_snapshot;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Badge EN SERVICIO */}
      <View style={styles.cardHeader}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>EN SERVICIO</Text>
        </View>
        <Icon name="arrow-right" size={16} color={colors.textSecondary} />
      </View>

      {/* ID de orden */}
      <Text style={[styles.orderId, { color: colors.textSecondary }]}>
        Orden #{order.id.slice(0, 8).toUpperCase()}
      </Text>

      {/* Fecha programada */}
      <View style={styles.infoRow}>
        <Icon name="calendar" size={14} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          {formatDate(order.scheduled_at)}
        </Text>
      </View>

      {/* Dirección */}
      {address && (
        <View style={styles.infoRow}>
          <Icon name="gps" size={14} color={colors.primary} />
          <Text
            style={[styles.infoText, { color: colors.text }]}
            numberOfLines={1}
          >
            {(address as any).address_line} {(address as any).building_number}
          </Text>
        </View>
      )}

      {/* Total + botón live */}
      <View style={styles.cardFooter}>
        <Text style={[styles.totalText, { color: colors.primary }]}>
          {formatTotal(order.total_snapshot, order.currency)}
        </Text>
        <View style={[styles.streamBtn, { backgroundColor: colors.primary }]}>
          <Icon name="visualize" size={14} color="#FFF" />
          <Text style={styles.streamBtnText}>Iniciar live</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function GroomerAppointmentsScreen() {
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
      const data = await groomerService.getMyAssignments("in_service");
      setOrders(data);
    } catch (err) {
      console.error("[Groomer] Error cargando órdenes:", err);
      setError("No se pudo cargar tus órdenes.");
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
      pathname: "/(tabs)/(groomer)/live-stream",
      params: { orderId: order.id },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title="Mis órdenes activas" right={{ type: "none" }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando órdenes...
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
      <ScreenHeader title="Mis órdenes activas" right={{ type: "none" }} />

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
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
        ListEmptyComponent={
          <View style={styles.centered}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Icon name="calendar" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {error ?? "Sin órdenes activas"}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {error
                ? "Desliza hacia abajo para reintentar"
                : "Cuando tengas órdenes en servicio aparecerán aquí"}
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

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xl, flexGrow: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E535351A",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#E53535" },
  liveBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: "#E53535",
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    letterSpacing: 0.5,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  totalText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  streamBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  streamBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: "#FFF",
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
