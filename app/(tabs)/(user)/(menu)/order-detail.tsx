import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { orderService } from "@/api/services/order.service";
import { Order, TypeStatus, OrderItem } from "@/types/order.types";

// ─── Configuración de estados ──────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  icon: string;
}

const STATUS_CONFIG: Record<TypeStatus, StatusConfig> = {
  created: {
    label: "Pendiente de asignación",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "calendar",
  },
  accepted: {
    label: "Especialista asignado",
    color: "#3B82F6",
    bg: "#DBEAFE",
    icon: "check",
  },
  on_the_way: {
    label: "Especialista en camino",
    color: "#8B5CF6",
    bg: "#EDE9FE",
    icon: "transport",
  },
  in_service: {
    label: "Servicio en curso",
    color: "#E53535",
    bg: "#FEE2E2",
    icon: "visualize",
  },
  done: {
    label: "Servicio finalizado",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "check",
  },
  cancelled: {
    label: "Servicio cancelado",
    color: "#6B7280",
    bg: "#F3F4F6",
    icon: "close",
  },
};

// Pasos del progreso visible al usuario
const PROGRESS_STEPS: {
  status: TypeStatus;
  label: string;
  sublabel: string;
}[] = [
  {
    status: "created",
    label: "Pendiente de\nasignación",
    sublabel: "Buscando especialista",
  },
  {
    status: "accepted",
    label: "Especialista\nasignado",
    sublabel: "Confirmado",
  },
  {
    status: "on_the_way",
    label: "Especialista\nen camino",
    sublabel: "En ruta",
  },
  {
    status: "in_service",
    label: "Servicio en\ncurso",
    sublabel: "En atención",
  },
  { status: "done", label: "Servicio\nfinalizado", sublabel: "Completado" },
];

const STATUS_ORDER: TypeStatus[] = [
  "created",
  "accepted",
  "on_the_way",
  "in_service",
  "done",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatScheduledDate(iso: string | null): string {
  if (!iso) return "Sin fecha programada";
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

function formatPrice(cents: number, currency: string): string {
  return `${currency} ${cents.toFixed(2)}`;
}

function getStatusIndex(status: TypeStatus): number {
  if (status === "cancelled") return -1;
  return STATUS_ORDER.indexOf(status);
}

// ─── Componente de progreso ────────────────────────────────────────────────────

const ProgressTimeline: React.FC<{ status: TypeStatus }> = ({ status }) => {
  const { colors } = useTheme();
  const currentIndex = getStatusIndex(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <View style={[styles.cancelledBanner, { backgroundColor: "#FEE2E2" }]}>
        <Icon name="close" size={16} color="#E53535" />
        <Text style={[styles.cancelledText, { color: "#E53535" }]}>
          Este servicio fue cancelado
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.progressContainer}>
      {PROGRESS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === PROGRESS_STEPS.length - 1;

        return (
          <View key={step.status} style={styles.progressStep}>
            {/* Línea izquierda */}
            {index > 0 && (
              <View
                style={[
                  styles.progressLine,
                  styles.progressLineLeft,
                  {
                    backgroundColor:
                      index <= currentIndex ? colors.primary : "#E5E7EB",
                  },
                ]}
              />
            )}

            {/* Nodo */}
            <View style={styles.progressNodeWrapper}>
              <View
                style={[
                  styles.progressNode,
                  {
                    backgroundColor: isCompleted ? colors.primary : "#E5E7EB",
                    borderColor: isCurrent ? colors.primary : "transparent",
                    borderWidth: isCurrent ? 2 : 0,
                  },
                ]}
              >
                {isCompleted && <Icon name="check" size={10} color="#FFF" />}
              </View>
            </View>

            {/* Línea derecha */}
            {!isLast && (
              <View
                style={[
                  styles.progressLine,
                  styles.progressLineRight,
                  {
                    backgroundColor:
                      index < currentIndex ? colors.primary : "#E5E7EB",
                  },
                ]}
              />
            )}

            {/* Etiqueta */}
            <Text
              style={[
                styles.progressLabel,
                {
                  color: isCompleted ? colors.primary : colors.textSecondary,
                  fontFamily: isCurrent
                    ? Typography.fontFamily.semibold
                    : Typography.fontFamily.regular,
                },
              ]}
              numberOfLines={2}
            >
              {isCurrent ? step.sublabel : step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── Sección con borde ─────────────────────────────────────────────────────────

const InfoSection: React.FC<{
  label: string;
  icon?: string;
  children: React.ReactNode;
  colors: any;
}> = ({ label, icon, children, colors }) => (
  <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
    <View style={styles.infoSectionHeader}>
      {icon && (
        <Icon name={icon as any} size={14} color={colors.textSecondary} />
      )}
      <Text style={[styles.infoSectionLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
    {children}
  </View>
);

// ─── Pantalla ──────────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error("[OrderDetail] Error cargando orden:", err);
        setError("No se pudo cargar el detalle del pedido.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [orderId]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title="Detalle del pedido" />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title="Detalle del pedido" />
        <View style={styles.emptyContainer}>
          <Icon name="calendar" size={40} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error ?? "Pedido no encontrado"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[order.status];
  const address = order.delivery_address_snapshot;
  const mainItem = order.items_snapshot?.find((i) => i.kind === "service_base");
  const addonItems =
    order.items_snapshot?.filter((i) => i.kind !== "service_base") ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader
        title={`Pedido #${order.id.slice(0, 8).toUpperCase()}`}
        backHref={"my-orders"}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Badge de estado y fecha de creación ────────────────────────── */}
        <View style={styles.topRow}>
          <Text style={[styles.createdAt, { color: colors.textSecondary }]}>
            Creado el {formatCreatedAt(order.created_at)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* ── Progreso del servicio ───────────────────────────────────────── */}
        <InfoSection label="PROGRESO DEL PEDIDO" colors={colors}>
          <ProgressTimeline status={order.status} />
        </InfoSection>

        {/* ── Fecha del servicio ──────────────────────────────────────────── */}
        <InfoSection label="FECHA DEL SERVICIO" icon="calendar" colors={colors}>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {formatScheduledDate(order.scheduled_at)}
          </Text>
        </InfoSection>

        {/* ── Dirección ──────────────────────────────────────────────────── */}
        {address && (
          <InfoSection label="DIRECCIÓN DE SERVICIO" icon="gps" colors={colors}>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {address.address_line}
              {address.building_number ? ` ${address.building_number}` : ""}
            </Text>
            {address.reference && (
              <Text
                style={[styles.infoSubvalue, { color: colors.textSecondary }]}
              >
                Ref: {address.reference}
              </Text>
            )}
          </InfoSection>
        )}

        {/* ── Resumen del servicio ────────────────────────────────────────── */}
        <InfoSection
          label="RESUMEN DEL SERVICIO"
          icon="services"
          colors={colors}
        >
          {/* Item principal */}
          {mainItem && (
            <View style={styles.summaryRow}>
              <View
                style={[
                  styles.itemKindBadge,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Text style={[styles.itemKindText, { color: colors.primary }]}>
                  Principal
                </Text>
              </View>
              <Text
                style={[styles.summaryItemName, { color: colors.text }]}
                numberOfLines={2}
              >
                {mainItem.name}
              </Text>
              <Text style={[styles.summaryItemPrice, { color: colors.text }]}>
                {formatPrice(mainItem.unit_price, order.currency)}
              </Text>
            </View>
          )}

          {/* Addons */}
          {addonItems.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <View
                style={[
                  styles.itemKindBadge,
                  { backgroundColor: colors.textSecondary + "18" },
                ]}
              >
                <Text
                  style={[styles.itemKindText, { color: colors.textSecondary }]}
                >
                  Adicional
                </Text>
              </View>
              <Text
                style={[styles.summaryItemName, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <Text style={[styles.summaryItemPrice, { color: colors.text }]}>
                {formatPrice(item.unit_price, order.currency)}
              </Text>
            </View>
          ))}

          {/* Divider y total */}
          <View
            style={[styles.totalDivider, { backgroundColor: colors.shadow }]}
          />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {formatPrice(order.total_snapshot, order.currency)}
            </Text>
          </View>
        </InfoSection>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },

  // Top row
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  createdAt: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Progress timeline
  progressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  progressNodeWrapper: {
    zIndex: 2,
  },
  progressNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  progressLine: {
    position: "absolute",
    height: 2,
    top: 10,
    width: "50%",
    zIndex: 1,
  },
  progressLineLeft: {
    left: 0,
  },
  progressLineRight: {
    right: 0,
  },
  progressLabel: {
    fontSize: 9,
    textAlign: "center",
    marginTop: Spacing.xs,
    lineHeight: 13,
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  cancelledText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },

  // InfoSection
  infoSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  infoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 2,
  },
  infoSectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  infoSubvalue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: 3,
  },
  itemKindBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  itemKindText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
  },
  summaryItemName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  summaryItemPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  totalDivider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  totalValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },

  // Empty / error
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: 400,
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    textAlign: "center",
  },
});
