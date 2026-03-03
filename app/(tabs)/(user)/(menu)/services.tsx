import React from "react";
import { StyleSheet, ScrollView, ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";
import { ServiceCard } from "@/components/home";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useCartDrawerStore } from "@/store/cartDrawerStore";
import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/api/services/store.service";
import { useBookingStore } from "@/store/bookingStore";

export default function ServicesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { open: openCartDrawer } = useCartDrawerStore();
  const { clearBooking } = useBookingStore();

  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["storeCategories"],
    queryFn: () => storeService.getCategories(),
    staleTime: 1000 * 60 * 5,
  });

  const handleCategoryPress = (slug: string) => {
    clearBooking();
    router.push("/(tabs)/(user)/select-pet");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader
        title="Nuestros servicios"
        backHref="/(tabs)/(user)/"
        right={{ type: "icon", name: "cart", onPress: openCartDrawer }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {isError && (
          <View style={styles.centered}>
            <Text style={{ color: colors.textSecondary }}>
              No se pudieron cargar los servicios.
            </Text>
          </View>
        )}

        {categories?.map((category) => (
          <ServiceCard
            key={category.id}
            title={category.name}
            subtitle="Grooming inteligente."
            onPress={() => handleCategoryPress(category.slug)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.md },
  centered: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
});
