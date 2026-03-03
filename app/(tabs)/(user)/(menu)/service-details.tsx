import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useCartDrawerStore } from "@/store/cartDrawerStore";
import { useBookingStore } from "@/store/bookingStore";
import { useStoreProducts } from "@/hooks/useStoreProducts";
import { StoreProduct } from "@/types/store.types";

const CATEGORY_SLUG = "paku-spa";

const BADGES = [
  { text: "Recomendado", color: "#FFB6C1" },
  { text: "Más lujo", color: "#FFB6C1" },
  { text: "Cachorro", color: "#FFB6C1" },
];

const ProductCard: React.FC<{
  product: StoreProduct;
  index: number;
  onPress: () => void;
}> = ({ product, index, onPress }) => {
  const { colors } = useTheme();
  const badge = BADGES[index] ?? null;

  return (
    <View style={[styles.packageCard, { backgroundColor: colors.surface }]}>
      <ImageBackground
        source={require("@assets/images/profile/profile-pet.png")}
        style={styles.packageBackground}
        imageStyle={styles.packageBackgroundImage}
      >
        <View style={styles.packageOverlay} />
      </ImageBackground>

      <View style={styles.packageContent}>
        {/* Header */}
        <View style={styles.packageHeader}>
          <View style={styles.packageTitleContainer}>
            <Text style={[styles.packageTitle, { color: colors.primary }]}>
              {product.name}
            </Text>
            {badge && (
              <View style={[styles.badge, { backgroundColor: badge.color }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {badge.text}
                </Text>
              </View>
            )}
          </View>
          {product.description && (
            <Text style={[styles.packageSubtitle, { color: colors.text }]}>
              {product.description}
            </Text>
          )}
        </View>

        {/* Price */}
        <Text style={[styles.packagePrice, { color: colors.primary }]}>
          {product.price
            ? `Costo: ${product.currency} ${product.price.toFixed(2)}`
            : "Precio según cotización"}
        </Text>

        {/* Button */}
        <Button title="Elegir este spa" onPress={onPress} fullWidth />
      </View>
    </View>
  );
};

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { open: openCartDrawer } = useCartDrawerStore();
  const { petId, petSpecies, setProduct } = useBookingStore();

  const {
    data: products,
    isLoading,
    isError,
  } = useStoreProducts(
    CATEGORY_SLUG,
    petId ?? undefined,
    petSpecies ?? undefined,
  );

  const handleSelectProduct = (product: StoreProduct) => {
    setProduct({
      productId: product.id,
      productName: product.name,
      categorySlug: CATEGORY_SLUG,
    });
    router.push("/(tabs)/(user)/additional-service");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader
        title="Elige tu servicio"
        backHref="/(tabs)/(user)/select-pet"
        right={{ type: "icon", name: "cart", onPress: openCartDrawer }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          PAKU Spa
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
          Cuidado profesional, seguimiento en vivo y total transparencia desde
          tu app.
        </Text>

        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{ color: colors.textSecondary, marginTop: Spacing.sm }}
            >
              Cargando servicios...
            </Text>
          </View>
        )}

        {isError && (
          <View style={styles.centered}>
            <Text style={{ color: colors.textSecondary }}>
              No se pudo cargar los servicios. Intenta de nuevo.
            </Text>
          </View>
        )}

        {products?.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            onPress={() => handleSelectProduct(product)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.md,
  },
  cardContent: { flex: 1, marginRight: Spacing.md },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  centered: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  serviceInfo: {
    marginBottom: Spacing.lg,
  },
  serviceMainTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  serviceDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  packageCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  packageBackground: {
    width: "100%",
    height: 120,
  },
  packageBackgroundImage: {
    opacity: 1,
  },
  packageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  packageContent: {
    padding: Spacing.lg,
  },
  packageHeader: {
    marginBottom: Spacing.sm,
  },
  packageTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    flexWrap: "wrap",
  },
  packageTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    marginRight: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  packageSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  packagePrice: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
  },
});
