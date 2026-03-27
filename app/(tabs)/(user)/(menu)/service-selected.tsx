import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Text } from "@/components/common";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { BannerBase } from "@/components/home/BannerBase";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks";
import { useAddressStore } from "@/store/addressStore";
import { useBookingStore } from "@/store/bookingStore";
import { storeService } from "@/api/services/store.service";
import { StoreProductDetail } from "@/types/store.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number | null, currency: string): string {
  if (amount == null) return "Incluido";
  return `${currency} ${amount.toFixed(2)}`;
}

// ─── Fila de detalle ──────────────────────────────────────────────────────────

const DetailRow: React.FC<{
  label: string;
  value: string;
  colors: any;
  highlight?: boolean;
}> = ({ label, value, colors, highlight }) => (
  <View style={rowStyles.row}>
    <Text style={[rowStyles.label, { color: colors.textSecondary }]}>
      {label}
    </Text>
    <Text
      style={[
        rowStyles.value,
        { color: highlight ? colors.primary : colors.text },
      ]}
    >
      {value}
    </Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },
  value: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: "right",
    flexShrink: 1,
    marginLeft: Spacing.sm,
  },
});

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function ServiceSelectedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    productId,
    productName,
    quotedTotal,
    currency,
    selectedAddonIds,
    petId,
    appliedCoupon,
    couponDiscount,
  } = useBookingStore();
  const { fetchAddresses } = useAddressStore();

  const [product, setProduct] = useState<StoreProductDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar detalles del producto para mostrar descripción y addons con nombres
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    storeService
      .getProduct(productId, petId ?? undefined)
      .then(setProduct)
      .catch((err) =>
        console.error("[ServiceSelected] Error cargando producto:", err),
      )
      .finally(() => setLoading(false));
  }, [productId, petId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchAddresses();
    }, []),
  );

  // Addons seleccionados con nombre y precio
  const selectedAddons =
    product?.available_addons.filter((a) => selectedAddonIds.includes(a.id)) ??
    [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader
        title="Detalles de la reserva"
        backHref="/(tabs)/(user)/additional-service"
        right={{
          type: "icon",
          name: "cart",
          onPress: () => router.push("/(tabs)/(user)/cart"),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <BannerBase
          imageSource={require("@assets/images/services/banner-service-1.png")}
          title="Grooming sin estrés"
          subtitle="Elige el PAKU Spa ideal para tu mascota."
        />

        <View style={styles.body}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Cargando detalles...
              </Text>
            </View>
          ) : (
            <>
              {/* Título y descripción */}
              <View style={styles.titleSection}>
                <Text style={[styles.serviceTitle, { color: colors.primary }]}>
                  PAKU Spa — {productName}
                </Text>
                {product?.description ? (
                  <Text
                    style={[
                      styles.serviceDesc,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {product.description}
                  </Text>
                ) : null}
              </View>

              {/* Card resumen */}
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Resumen del pedido
                </Text>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                {/* Servicio base */}
                <DetailRow
                  label={productName ?? "Servicio"}
                  value={formatPrice(product?.price ?? null, currency)}
                  colors={colors}
                />

                {/* Adicionales */}
                {selectedAddons.length > 0 && (
                  <>
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Adicionales ({selectedAddons.length})
                    </Text>
                    {selectedAddons.map((addon) => (
                      <DetailRow
                        key={addon.id}
                        label={`  • ${addon.name}`}
                        value={formatPrice(addon.price, currency)}
                        colors={colors}
                      />
                    ))}
                  </>
                )}

                {/* Cupón */}
                {appliedCoupon && couponDiscount > 0 && (
                  <>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />
                    <DetailRow
                      label={`Cupón: ${appliedCoupon}`}
                      value={`-${formatPrice(couponDiscount, currency)}`}
                      colors={colors}
                    />
                  </>
                )}

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                {/* Total */}
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    Total
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>
                    {quotedTotal != null
                      ? formatPrice(quotedTotal, currency)
                      : "Calculando..."}
                  </Text>
                </View>
              </View>

              {/* Tip si no tiene adicionales */}
              {selectedAddonIds.length === 0 && (
                <View
                  style={[
                    styles.tipBox,
                    { backgroundColor: colors.primary + "12" },
                  ]}
                >
                  <Text style={[styles.tipText, { color: colors.primary }]}>
                    💡 Puedes agregar servicios adicionales desde la pantalla
                    anterior
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Espacio para el footer fijo */}
          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* Footer fijo con total y botón */}
      <View
        style={[
          styles.fixedFooter,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.footerPriceRow}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            Total a pagar
          </Text>
          <Text style={[styles.footerTotal, { color: colors.primary }]}>
            {quotedTotal != null
              ? formatPrice(quotedTotal, currency)
              : "Calculando..."}
          </Text>
        </View>
        <Button
          title="Continuar reserva"
          textStyle={{ fontSize: Typography.fontSize.sm }}
          style={{ borderRadius: BorderRadius.full }}
          onPress={() => router.push("/(tabs)/(user)/select-address")}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  body: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },

  titleSection: {
    marginBottom: Spacing.lg,
  },
  serviceTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  serviceDesc: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },

  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },

  tipBox: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },

  fixedFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  footerPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  footerLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  footerTotal: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
});
