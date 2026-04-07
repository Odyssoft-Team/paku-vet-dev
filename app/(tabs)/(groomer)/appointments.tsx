import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { groomerService } from "@/api/services/groomer.service";
import { Order, TypeStatus } from "@/types/order.types";

// ─── Configuración de estados ──────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

const STATUS_CONFIG: Record<TypeStatus, StatusConfig> = {
  created: { label: "NUEVA", color: "#F59E0B", bg: "#F59E0B1A" },
  accepted: { label: "ACEPTADA", color: "#3B82F6", bg: "#3B82F61A" },
  on_the_way: { label: "EN CAMINO", color: "#8B5CF6", bg: "#8B5CF61A" },
  in_service: { label: "EN SERVICIO", color: "#E53535", bg: "#E535351A" },
  done: { label: "COMPLETADA", color: "#10B981", bg: "#10B9811A" },
  cancelled: { label: "CANCELADA", color: "#6B7280", bg: "#6B72801A" },
};

// ─── Filtros de pestaña ────────────────────────────────────────────────────────

type FilterTab = TypeStatus | "all";

interface FilterConfig {
  key: FilterTab;
  label: string;
  color: string;
}

const FILTER_TABS: FilterConfig[] = [
  { key: "all", label: "Todas", color: "#6B7280" },
  { key: "created", label: "Nuevas", color: "#F59E0B" },
  { key: "accepted", label: "Aceptadas", color: "#3B82F6" },
  { key: "on_the_way", label: "En camino", color: "#8B5CF6" },
  { key: "in_service", label: "En servicio", color: "#E53535" },
  { key: "done", label: "Completadas", color: "#10B981" },
  { key: "cancelled", label: "Canceladas", color: "#6B7280" },
];

// Qué estados puede tomar una orden desde cada estado actual
const NEXT_STATES: Partial<Record<TypeStatus, TypeStatus[]>> = {
  created: ["accepted", "cancelled"],
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["in_service", "cancelled"],
  in_service: ["done"],
};

const ACTION_LABEL: Partial<Record<TypeStatus, string>> = {
  accepted: "Aceptar",
  on_the_way: "En camino",
  in_service: "Iniciar servicio",
  done: "Marcar como hecho",
  cancelled: "Cancelar",
};

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
  return `${currency} ${total.toFixed(2)}`;
}

// ─── Componente de tarjeta de orden ───────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  isUpdating: boolean;
  onChangeStatus: (orderId: string, next: TypeStatus) => void;
  onLivePress: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isUpdating,
  onChangeStatus,
  onLivePress,
}) => {
  const { colors } = useTheme();
  const address = order.delivery_address_snapshot;
  const status = order.status;
  const cfg = STATUS_CONFIG[status];
  const nextStates = NEXT_STATES[status] ?? [];
  const isTerminal = status === "done" || status === "cancelled";

  const handlePress = (next: TypeStatus) => {
    if (next === "cancelled") {
      Alert.alert(
        "Cancelar orden",
        "¿Estás seguro de que quieres cancelar esta orden?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Sí, cancelar",
            style: "destructive",
            onPress: () => onChangeStatus(order.id, next),
          },
        ],
      );
      return;
    }
    onChangeStatus(order.id, next);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        isTerminal && styles.cardTerminal,
      ]}
    >
      {/* Header: badge de estado + spinner si está actualizando */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
        {isUpdating && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
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
            {address.address_line} {address.building_number}
          </Text>
        </View>
      )}

      {/* Total */}
      <Text style={[styles.totalText, { color: colors.primary }]}>
        {formatTotal(order.total_snapshot, order.currency)}
      </Text>

      {/* Acciones — solo si la orden no es terminal */}
      {!isTerminal && (
        <View style={styles.actionsRow}>
          {/* Botón "Iniciar live" — SOLO cuando status === "in_service" */}
          {status === "in_service" && (
            <TouchableOpacity
              style={styles.liveBtn}
              onPress={onLivePress}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <Icon name="visualize" size={14} color="#FFF" />
              <Text style={styles.liveBtnText}>Iniciar live</Text>
            </TouchableOpacity>
          )}

          {/* Botones de transición de estado */}
          {nextStates.map((next) => {
            const isCancel = next === "cancelled";
            return (
              <TouchableOpacity
                key={next}
                style={[
                  styles.actionBtn,
                  isCancel
                    ? [
                        styles.actionBtnCancel,
                        { borderColor: colors.textSecondary },
                      ]
                    : { backgroundColor: colors.primary },
                  isUpdating && styles.actionBtnDisabled,
                ]}
                onPress={() => handlePress(next)}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: isCancel ? colors.textSecondary : "#FFF" },
                  ]}
                >
                  {ACTION_LABEL[next] ?? next}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

// ─── Barra de filtros ─────────────────────────────────────────────────────────

interface FilterBarProps {
  activeFilter: FilterTab;
  onSelect: (filter: FilterTab) => void;
  colors: any;
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onSelect,
  colors,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.filterBar}
    style={styles.filterBarWrapper}
  >
    {FILTER_TABS.map((tab) => {
      const isActive = activeFilter === tab.key;
      return (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.filterPill,
            isActive
              ? { backgroundColor: tab.color, borderColor: tab.color }
              : {
                  backgroundColor: "transparent",
                  borderColor: colors.border ?? "#E5E7EB",
                },
          ]}
          onPress={() => onSelect(tab.key)}
          activeOpacity={0.75}
        >
          {isActive && (
            <View style={[styles.filterDot, { backgroundColor: "#FFF" }]} />
          )}
          <Text
            style={[
              styles.filterPillText,
              { color: isActive ? "#FFF" : colors.textSecondary },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function GroomerAppointmentsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // orderId → true mientras se procesa el cambio de estado
  const [updatingMap, setUpdatingMap] = useState<Record<string, boolean>>({});

  const fetchOrders = useCallback(async (filter: FilterTab, silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const status = filter === "all" ? undefined : filter;
      const data = await groomerService.getMyAssignments(status);
      setOrders(data);
    } catch (err) {
      console.error("[Groomer] Error cargando órdenes:", err);
      setError("No se pudo cargar tus citas.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeFilter);
  }, [activeFilter, fetchOrders]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders(activeFilter, true);
  }, [activeFilter, fetchOrders]);

  const handleFilterChange = (filter: FilterTab) => {
    if (filter === activeFilter) return;
    setActiveFilter(filter);
    // el useEffect se encarga de llamar fetchOrders con el nuevo filtro
  };

  const handleChangeStatus = useCallback(
    async (orderId: string, next: TypeStatus) => {
      setUpdatingMap((prev) => ({ ...prev, [orderId]: true }));
      try {
        if (next === "cancelled") {
          await groomerService.cancelOrder(orderId);
        } else {
          await groomerService.changeStatus(orderId, next);
        }
        // Si hay un filtro activo, recargamos para que la lista refleje
        // correctamente las órdenes que pertenecen a ese estado.
        // Si estamos en "Todas", hacemos actualización local para evitar
        // un flash de carga innecesario.
        if (activeFilter === "all") {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: next } : o)),
          );
        } else {
          await fetchOrders(activeFilter, true);
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail ??
          err?.response?.data?.message ??
          "No se pudo actualizar el estado.";
        Alert.alert("Error", msg);
      } finally {
        setUpdatingMap((prev) => ({ ...prev, [orderId]: false }));
      }
    },
    [activeFilter, fetchOrders],
  );

  const handleLivePress = (order: Order) => {
    router.push({
      pathname: "/(tabs)/(groomer)/live-stream",
      params: { orderId: order.id, ts: Date.now() },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title="Mis citas" right={{ type: "none" }} />
        <FilterBar
          activeFilter={activeFilter}
          onSelect={handleFilterChange}
          colors={colors}
        />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando citas...
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
      <ScreenHeader title="Mis citas" right={{ type: "none" }} />

      <FilterBar
        activeFilter={activeFilter}
        onSelect={handleFilterChange}
        colors={colors}
      />

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
              {error ?? "Sin citas"}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {error
                ? "Desliza hacia abajo para reintentar"
                : activeFilter === "all"
                  ? "Cuando tengas citas asignadas aparecerán aquí"
                  : `No tienes citas con estado "${FILTER_TABS.find((f) => f.key === activeFilter)?.label ?? activeFilter}"`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            isUpdating={!!updatingMap[item.id]}
            onChangeStatus={handleChangeStatus}
            onLivePress={() => handleLivePress(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.sm,
  },

  // Card
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardTerminal: {
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Badge de estado
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },

  // Info rows
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
  totalText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    marginTop: Spacing.xs,
  },

  // Acciones
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  liveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "#E53535",
  },
  liveBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: "#FFF",
  },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  actionBtnCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Filter bar
  filterBarWrapper: {
    flexGrow: 0, // impide que el ScrollView se expanda verticalmente
    flexShrink: 0,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterPillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    includeFontPadding: false,
  },

  // Empty / loading state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    minHeight: 400, // garantiza altura suficiente dentro del FlatList
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
