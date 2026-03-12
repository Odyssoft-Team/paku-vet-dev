import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useTheme } from "@/hooks";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon } from "@/components/common";
import { OrderProgressBar } from "@/components/common/OrdenProgressBar";
import { useOrderStore } from "@/store/orderStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { orderService } from "@/api/services/order.service";

const ACTIVE_STATUSES = ["created", "accepted", "on_the_way", "in_service"];

export default function TrackingServiceScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { order, setOrder } = useOrderStore();

  // ── Fetch detalle de la orden ──────────────────────────────────────────
  const loadOrderDetail = async () => {
    if (!order?.id) return;
    try {
      const updated = await orderService.getOrderById(order.id);
      setOrder(updated);
      if (updated.status === "done" || updated.status === "cancelled") {
        router.replace("/(tabs)/(user)/");
      }
    } catch (error) {
      console.log("Error cargando detalle de orden:", error);
    }
  };

  useEffect(() => {
    loadOrderDetail();

    let interval: any;
    if (order?.id && ACTIVE_STATUSES.includes(order.status)) {
      interval = setInterval(loadOrderDetail, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order?.id, order?.status]);

  // ── Datos del snapshot ─────────────────────────────────────────────────
  const item = order?.items_snapshot?.[0];
  const address = order?.delivery_address_snapshot;
  const scheduledDate = item?.meta?.scheduled_date;
  const scheduledTime = item?.meta?.scheduled_time;
  const addonCount = item?.meta?.addon_ids?.length ?? 0;
  const totalFormatted = order
    ? `${order.currency} ${(order.total_snapshot / 100).toFixed(2)}`
    : "-";

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Layout principal — dos bloques que se reparten el espacio
    topSection: { flex: 1 },
    bottomSection: {
      backgroundColor: colors.loginButton,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: Spacing.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 10,
    },

    // Mapa placeholder
    mapContainer: {
      height: 220,
      backgroundColor: colors.border,
      margin: Spacing.md,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    mapPlaceholderText: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
      fontFamily: Typography.fontFamily.regular,
      marginTop: Spacing.sm,
    },

    // Cards de info
    scrollContent: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    cardTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.xs,
    },
    label: {
      fontSize: Typography.fontSize.xs,
      color: colors.textSecondary,
      fontFamily: Typography.fontFamily.regular,
    },
    value: {
      fontSize: Typography.fontSize.xs,
      color: colors.text,
      fontFamily: Typography.fontFamily.semibold,
      textAlign: "right",
      flex: 1,
      paddingLeft: Spacing.sm,
    },

    // Footer
    driverRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    avatarPlaceholder: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: Spacing.md,
    },
    initials: {
      color: "#FFF",
      fontSize: 20,
      fontFamily: Typography.fontFamily.bold,
    },
    infoContainer: { flex: 1 },
    titleDriver: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    textDriver: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.primary,
      lineHeight: 18,
    },
    ratingBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E8FBF2",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.xl,
      alignSelf: "flex-start",
    },
    ratingText: {
      fontSize: 11,
      fontFamily: Typography.fontFamily.bold,
      color: "#4ADE80",
      marginRight: 4,
    },
    liveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: BorderRadius.lg,
      paddingVertical: 14,
      marginTop: Spacing.sm,
      gap: 8,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FFF",
    },
    liveButtonText: {
      color: "#FFF",
      fontSize: Typography.fontSize.xs,
      fontFamily: "Poppins_700Bold",
      letterSpacing: 0.5,
    },
  });

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader
          title="Rastrear"
          backHref="/(tabs)/(user)/"
          right={{ type: "none" }}
        />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Rastrear"
        backHref="/(tabs)/(user)/"
        right={{ type: "none" }}
      />

      {/* ── Sección superior scrolleable ─────────────────────────────────── */}
      <View style={styles.topSection}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Mapa placeholder */}
          <View style={styles.mapContainer}>
            <Icon name="gps" size={48} color={colors.textSecondary} />
            <Text style={styles.mapPlaceholderText}>Mapa de seguimiento</Text>
          </View>

          {/* Detalle del servicio */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Detalle del servicio</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Servicio</Text>
              <Text style={styles.value}>{item?.name ?? "-"}</Text>
            </View>
            {addonCount > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Adicionales</Text>
                <Text style={styles.value}>
                  {addonCount} seleccionado{addonCount > 1 ? "s" : ""}
                </Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Total</Text>
              <Text style={styles.value}>{totalFormatted}</Text>
            </View>
          </View>

          {/* Fecha programada */}
          {(scheduledDate || scheduledTime) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Fecha programada</Text>
              {scheduledDate && (
                <View style={styles.row}>
                  <Text style={styles.label}>Fecha</Text>
                  <Text style={styles.value}>{scheduledDate}</Text>
                </View>
              )}
              {scheduledTime && (
                <View style={styles.row}>
                  <Text style={styles.label}>Hora</Text>
                  <Text style={styles.value}>{scheduledTime}</Text>
                </View>
              )}
            </View>
          )}

          {/* Dirección */}
          {address && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dirección de atención</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Dirección</Text>
                <Text style={styles.value}>
                  {address.address_line} {address.building_number}
                  {address.apartment_number
                    ? `, ${address.apartment_number}`
                    : ""}
                </Text>
              </View>
              {address.reference && (
                <View style={styles.row}>
                  <Text style={styles.label}>Referencia</Text>
                  <Text style={styles.value}>{address.reference}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── Sección inferior fija ─────────────────────────────────────────── */}
      <View style={styles.bottomSection}>
        {/* Groomer info */}
        <View style={styles.driverRow}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>G</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.titleDriver}>Groomer asignado</Text>
            <Text style={styles.textDriver}>
              {order.ally_id
                ? `ID: ${order.ally_id}`
                : "Pendiente de asignación"}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>4.8</Text>
            <Icon name="start" size={14} color="#4ADE80" />
          </View>
        </View>

        {/* Barra de progreso */}
        <View style={{ marginVertical: Spacing.sm }}>
          {order.status !== "done" && order.status !== "cancelled" && (
            <OrderProgressBar currentStatus={order.status} />
          )}
        </View>

        {/* Botón Ver en vivo */}
        {order.status === "in_service" && (
          <TouchableOpacity
            style={[styles.liveButton, { backgroundColor: "#E53935" }]}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(user)/live-view",
                params: { orderId: order.id },
              })
            }
          >
            <View style={styles.liveDot} />
            <Text style={styles.liveButtonText}>Ver en vivo</Text>
          </TouchableOpacity>
        )}

        <Button
          title="Reprogramar"
          textStyle={{ fontSize: Typography.fontSize.xs }}
          style={{
            borderRadius: BorderRadius.lg,
            paddingVertical: 14,
            marginTop: Spacing.sm,
          }}
          onPress={() => {}}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
