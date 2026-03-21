import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { Text } from "@/components/common/Text";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button, Icon } from "@/components/common";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { OrderProgressBar } from "@/components/common/OrdenProgressBar";
import { useOrderStore } from "@/store/orderStore";
import { useAllyTracking } from "@/hooks/useAllyTracking";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { orderService } from "@/api/services/order.service";

const ACTIVE_STATUSES = ["created", "accepted", "on_the_way", "in_service"];

// ─── Pin pulsante del groomer ─────────────────────────────────────────────────

const PulsingPin: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "#1D2AD820",
          position: "absolute",
          transform: [{ scale: pulseAnim }],
        }}
      />
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#1D2AD8",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: "#FFFFFF",
        }}
      >
        <Text style={{ fontSize: 16 }}>🚗</Text>
      </View>
    </View>
  );
};

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function TrackingServiceScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { order, setOrder } = useOrderStore();
  const mapRef = useRef<MapView>(null);

  // Status visual — puede cambiar localmente cuando el sim llega al destino
  const [displayStatus, setDisplayStatus] = useState(
    order?.status ?? "created",
  );

  // Destino del usuario (del snapshot de la orden)
  const destination = order?.delivery_address_snapshot?.lat
    ? {
        lat: order.delivery_address_snapshot.lat,
        lng: order.delivery_address_snapshot.lng,
      }
    : null;

  // Cuando el simulador llega al destino, cambiar a in_service visualmente
  const simulatedArrivalRef = useRef(false);

  // Cuando el simulador llega al destino, NO cambiamos el status —
  // solo el backend puede cambiar a "in_service" cuando el groomer confirme llegada
  const handleSimulatedArrival = useCallback(() => {
    simulatedArrivalRef.current = true;
    // No llamar setDisplayStatus aquí
  }, []);

  const { allyLocation, etaDisplay, isWaiting, isStale } = useAllyTracking({
    orderId: order?.id ?? null,
    orderStatus: displayStatus,
    destination,
    onSimulatedArrival: handleSimulatedArrival,
  });

  // ── Mover la cámara cuando llega una nueva posición del ally ──────────────
  const prevAllyRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!allyLocation || !mapRef.current) return;
    const prev = prevAllyRef.current;
    if (prev && prev.lat === allyLocation.lat && prev.lng === allyLocation.lng)
      return;
    prevAllyRef.current = allyLocation;

    // Siempre centrar en el groomer con zoom cercano
    mapRef.current.animateToRegion(
      {
        latitude: allyLocation.lat,
        longitude: allyLocation.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      600,
    );
  }, [allyLocation?.lat, allyLocation?.lng]);

  // ── Polling de estado de la orden ─────────────────────────────────────────
  const loadOrderDetail = async () => {
    if (!order?.id) return;
    try {
      const updated = await orderService.getOrderById(order.id);
      setOrder(updated);
      setDisplayStatus(updated.status);
      if (updated.status === "done" || updated.status === "cancelled") {
        router.replace("/(tabs)/(user)/");
      }
    } catch (error) {
      console.log("Error cargando detalle de orden:", error);
    }
  };

  useEffect(() => {
    loadOrderDetail();
    let interval: ReturnType<typeof setInterval> | undefined;
    if (order?.id && ACTIVE_STATUSES.includes(order.status)) {
      interval = setInterval(loadOrderDetail, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order?.id, order?.status]);

  // ── Datos del snapshot ────────────────────────────────────────────────────
  const item = order?.items_snapshot?.[0];
  const address = order?.delivery_address_snapshot;
  const scheduledDate = item?.meta?.scheduled_date;
  const scheduledTime = item?.meta?.scheduled_time;
  const addonCount = item?.meta?.addon_ids?.length ?? 0;
  const totalFormatted = order
    ? `${order.currency} ${(order.total_snapshot / 100).toFixed(2)}`
    : "-";

  const statusLabel =
    displayStatus === "in_service"
      ? "🐾 El groomer está contigo"
      : displayStatus === "on_the_way"
        ? "🚗 El groomer está en camino"
        : displayStatus === "accepted"
          ? "✅ Servicio confirmado"
          : "⏳ Buscando groomer...";

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topSection: { flex: 1 },
    bottomSection: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border + "30",
      padding: Spacing.lg,
      paddingBottom: Spacing.xl,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 10,
    },
    // Mapa
    mapContainer: {
      height: 240,
      margin: Spacing.md,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
    },
    map: { flex: 1 },
    mapOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    mapStatusText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFFFFF",
      flex: 1,
    },
    etaBadge: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    etaText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
    },
    staleWarning: {
      position: "absolute",
      top: Spacing.sm,
      alignSelf: "center",
      backgroundColor: "rgba(255,200,0,0.9)",
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
    },
    staleText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.semibold,
      color: "#111",
    },
    waitingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(255,255,255,0.75)",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    },
    waitingText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
    },
    // Cards
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
    // Footer groomer
    driverRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: Spacing.md,
    },
    initials: {
      color: "#FFF",
      fontSize: 18,
      fontFamily: Typography.fontFamily.bold,
    },
    infoContainer: { flex: 1 },
    titleDriver: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
    },
    textDriver: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
    },
    ratingBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E8FBF2",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.xl,
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
      paddingVertical: 12,
      marginTop: Spacing.sm,
      gap: 8,
      backgroundColor: "#E53935",
    },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFF" },
    liveButtonText: {
      color: "#FFF",
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.bold,
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

  // Región inicial del mapa
  const initialRegion: Region = destination
    ? {
        latitude: destination.lat,
        longitude: destination.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }
    : {
        latitude: -12.0464,
        longitude: -77.0428,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Seguimiento"
        backHref="/(tabs)/(user)/"
        right={{ type: "none" }}
      />

      <View style={styles.topSection}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Mapa ─────────────────────────────────────────────────────── */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={initialRegion}
              showsUserLocation={false}
              showsMyLocationButton={false}
              toolbarEnabled={false}
            >
              {/* Pin del destino (domicilio del usuario) */}
              {destination && (
                <Marker
                  coordinate={{
                    latitude: destination.lat,
                    longitude: destination.lng,
                  }}
                  title="Tu domicilio"
                  pinColor="#1D2AD8"
                />
              )}

              {/* Pin del groomer — animado */}
              {allyLocation && (
                <Marker
                  key={`${allyLocation.lat}-${allyLocation.lng}`}
                  coordinate={{
                    latitude: allyLocation.lat,
                    longitude: allyLocation.lng,
                  }}
                  title="Tu groomer"
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges
                >
                  <PulsingPin />
                </Marker>
              )}
            </MapView>

            {/* Overlay inferior con status + ETA */}
            <View style={styles.mapOverlay}>
              <Text style={styles.mapStatusText}>{statusLabel}</Text>
              {etaDisplay && (
                <View style={styles.etaBadge}>
                  <Text style={styles.etaText}>{etaDisplay}</Text>
                </View>
              )}
            </View>

            {/* Aviso de señal débil */}
            {isStale && (
              <View style={styles.staleWarning}>
                <Text style={styles.staleText}>
                  📡 Actualizando ubicación...
                </Text>
              </View>
            )}

            {/* Overlay de espera cuando el ally aún no reportó posición */}
            {isWaiting && (
              <View style={styles.waitingOverlay}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.waitingText}>Buscando al groomer...</Text>
              </View>
            )}
          </View>

          {/* ── Detalle del servicio ──────────────────────────────────────── */}
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

          {/* ── Fecha y dirección ─────────────────────────────────────────── */}
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

      {/* ── Footer fijo ───────────────────────────────────────────────────── */}
      <View style={styles.bottomSection}>
        {/* Info del groomer */}
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
        {displayStatus !== "done" && displayStatus !== "cancelled" && (
          <View style={{ marginBottom: Spacing.sm }}>
            <OrderProgressBar currentStatus={displayStatus} />
          </View>
        )}

        {/* Botón Ver en vivo — solo en in_service */}
        {displayStatus === "in_service" && (
          <TouchableOpacity
            style={styles.liveButton}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(user)/live-view",
                params: { orderId: order.id },
              })
            }
          >
            <View style={styles.liveDot} />
            <Text style={styles.liveButtonText}>📹 Ver en vivo</Text>
          </TouchableOpacity>
        )}

        <Button
          title="Reprogramar"
          textStyle={{ fontSize: Typography.fontSize.xs }}
          style={{
            borderRadius: BorderRadius.lg,
            paddingVertical: 12,
            marginTop: Spacing.sm,
          }}
          onPress={() => {}}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
