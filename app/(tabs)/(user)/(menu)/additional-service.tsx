import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks";
import { useBookingStore } from "@/store/bookingStore";
import { useStoreProduct } from "@/hooks/useStoreProduct";
import { storeService } from "@/api/services/store.service";
import { StoreAddon } from "@/types/store.types";

export default function AdditionalServiceScreen() {
  const { colors } = useTheme();
  const {
    petId,
    productId,
    productName,
    selectedAddonIds,
    setAddons,
    setQuotedTotal,
  } = useBookingStore();

  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const { data: productDetail, isLoading } = useStoreProduct(
    productId ?? "",
    petId ?? undefined,
  );

  const addons = productDetail?.available_addons ?? [];

  const toggleAddon = (addonId: string) => {
    if (selectedAddonIds.includes(addonId)) {
      setAddons(selectedAddonIds.filter((id) => id !== addonId));
    } else {
      setAddons([...selectedAddonIds, addonId]);
    }
  };

  const handleContinue = async () => {
    if (!petId || !productId) return;
    setQuoting(true);
    setQuoteError(null);
    try {
      const quote = await storeService.quote({
        pet_id: petId,
        product_id: productId,
        addon_ids: selectedAddonIds,
      });
      setQuotedTotal(quote.total, quote.currency);
      router.push("/(tabs)/(user)/service-selected");
    } catch (e) {
      setQuoteError("No se pudo calcular el precio. Intenta de nuevo.");
    } finally {
      setQuoting(false);
    }
  };

  // Total acumulado de addons seleccionados
  const addonsTotal = addons
    .filter((a) => selectedAddonIds.includes(a.id) && a.price != null)
    .reduce((sum, a) => sum + (a.price ?? 0), 0);

  const currency =
    addons.find((a) => selectedAddonIds.includes(a.id))?.currency ?? "PEN";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader
        title="Servicios adicionales"
        backHref="/(tabs)/(user)/service-details"
        right={{ type: "none" }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          {productName}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Personaliza el servicio con extras opcionales para tu mascota.
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: Spacing.xl }}
          />
        ) : addons.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Este servicio no tiene adicionales disponibles.
          </Text>
        ) : (
          addons.map((addon: StoreAddon) => {
            const isSelected = selectedAddonIds.includes(addon.id);
            const hasPrice = addon.price != null && addon.price > 0;

            return (
              <TouchableOpacity
                key={addon.id}
                style={[
                  styles.addonCard,
                  { backgroundColor: colors.surface },
                  isSelected && { borderColor: colors.primary },
                  !isSelected && { borderColor: colors.border },
                ]}
                onPress={() => toggleAddon(addon.id)}
                activeOpacity={0.8}
              >
                {/* Info del addon */}
                <View style={styles.addonInfo}>
                  <Text
                    style={[
                      styles.addonName,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {addon.name}
                  </Text>
                  {addon.description ? (
                    <Text
                      style={[
                        styles.addonDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {addon.description}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.addonPrice,
                      {
                        color: isSelected
                          ? colors.primary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {hasPrice
                      ? `+ ${addon.currency} ${addon.price!.toFixed(2)}`
                      : "Precio incluido"}
                  </Text>
                </View>

                {/* Icono de estado */}
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isSelected
                        ? colors.success
                        : colors.border + "40",
                    },
                  ]}
                >
                  <Icon
                    name={isSelected ? "check" : "plus"}
                    size={20}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Resumen de selección */}
        {selectedAddonIds.length > 0 && addonsTotal > 0 && (
          <View
            style={[
              styles.summaryBox,
              {
                backgroundColor: colors.primary + "10",
                borderColor: colors.primary + "30",
              },
            ]}
          >
            <Text style={[styles.summaryText, { color: colors.primary }]}>
              {selectedAddonIds.length} adicional
              {selectedAddonIds.length > 1 ? "es" : ""} seleccionado
              {selectedAddonIds.length > 1 ? "s" : ""}
            </Text>
            <Text style={[styles.summaryPrice, { color: colors.primary }]}>
              + {currency} {addonsTotal.toFixed(2)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Botón fijo */}
      <View
        style={[
          styles.fixedButton,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        {quoteError ? <Text style={styles.errorText}>{quoteError}</Text> : null}
        <Button
          title={
            selectedAddonIds.length > 0 ? "Continuar" : "Omitir y Continuar"
          }
          textStyle={{ fontSize: Typography.fontSize.sm }}
          style={{ borderRadius: BorderRadius.full }}
          onPress={handleContinue}
          loading={quoting}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  // Card de addon
  addonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  addonInfo: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 2,
  },
  addonName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  addonDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 16,
    marginTop: 2,
  },
  addonPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    marginTop: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Resumen
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  summaryText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  summaryPrice: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },

  emptyText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },

  fixedButton: {
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
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: "#E53935",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
});
