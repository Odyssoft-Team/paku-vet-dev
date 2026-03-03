import React, { useEffect, useState } from "react";
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
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
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

  const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: Spacing.md, paddingBottom: 140 },
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
      color: colors.textSecondary,
    },
    addonCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.surface,
      marginBottom: Spacing.sm,
      borderWidth: 2,
      borderColor: "transparent",
    },
    addonCardSelected: {
      borderColor: colors.primary,
    },
    addonInfo: { flex: 1, marginRight: Spacing.md },
    addonName: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.text,
    },
    addonPrice: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: Spacing.xl,
    },
    fixedButton: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.lg,
      backgroundColor: colors.loginButton,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 10,
    },
    errorText: {
      fontSize: Typography.fontSize.xs,
      color: "#E53935",
      textAlign: "center",
      marginBottom: Spacing.sm,
    },
  });

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
        <Text style={styles.sectionSubtitle}>
          Personaliza el servicio con extras opcionales para tu mascota.
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : addons.length === 0 ? (
          <Text style={styles.emptyText}>
            Este servicio no tiene adicionales disponibles.
          </Text>
        ) : (
          addons.map((addon: StoreAddon) => {
            const isSelected = selectedAddonIds.includes(addon.id);
            return (
              <TouchableOpacity
                key={addon.id}
                style={[
                  styles.addonCard,
                  isSelected && styles.addonCardSelected,
                ]}
                onPress={() => toggleAddon(addon.id)}
                activeOpacity={0.8}
              >
                <View style={styles.addonInfo}>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonPrice}>
                    {addon.price
                      ? `+ ${addon.currency} ${addon.price.toFixed(2)}`
                      : "Precio incluido"}
                  </Text>
                </View>
                <Icon
                  name={isSelected ? "check" : "close"}
                  size={24}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.fixedButton}>
        {quoteError && <Text style={styles.errorText}>{quoteError}</Text>}
        <Button
          title={
            selectedAddonIds.length > 0 ? "Continuar" : "Omitir y Continuar"
          }
          textStyle={{ fontSize: Typography.fontSize.sm }}
          style={{ borderRadius: BorderRadius.xl }}
          onPress={handleContinue}
          loading={quoting}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
