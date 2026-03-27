import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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

// ─── Metadata estática por índice de producto ─────────────────────────────────

interface ServiceMeta {
  badge: string;
  badgeColor: string;
  badgeTextColor: string;
  includes: string[];
  image: ImageSourcePropType;
  gradientColors: [string, string, string];
}

const SERVICE_META: ServiceMeta[] = [
  {
    badge: "⭐ Recomendado",
    badgeColor: "#FFB6C1",
    badgeTextColor: "#9C1C3A",
    includes: [
      "Limpieza completa y segura",
      "Cuidado básico de uñas y oídos",
      "Brillo y frescura inmediata",
    ],
    image: require("@assets/images/profile/profile-pet.png"),
    gradientColors: ["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"],
  },
  {
    badge: "✨ Pelo largo",
    badgeColor: "#B6D4FF",
    badgeTextColor: "#1A3A7A",
    includes: [
      "Hidratación profunda del pelaje",
      "Mascarilla nutritiva y acabado superior",
      "Suavidad y brillo prolongado",
    ],
    image: require("@assets/images/services/banner-service-1.png"),
    gradientColors: ["transparent", "rgba(0,0,20,0.4)", "rgba(0,0,20,0.85)"],
  },
  {
    badge: "🐾 Cachorros",
    badgeColor: "#B6FFD4",
    badgeTextColor: "#0A5C30",
    includes: [
      "Shampoo en seco hipoalergénico",
      "Ideal entre baños o para cachorros",
      "Frescura inmediata sin estrés",
    ],
    image: require("@assets/images/services/banner-service-1.png"),
    gradientColors: ["transparent", "rgba(0,20,10,0.4)", "rgba(0,20,10,0.85)"],
  },
];

// ─── Card Hero Inmersiva ──────────────────────────────────────────────────────

const ProductCard: React.FC<{
  product: StoreProduct;
  index: number;
  onPress: () => void;
}> = ({ product, index, onPress }) => {
  const { colors } = useTheme();
  const meta = SERVICE_META[index] ?? SERVICE_META[0];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* ── Hero: imagen + gradiente + badge + título + precio ── */}
      <ImageBackground
        source={meta.image}
        style={styles.heroImage}
        imageStyle={styles.heroImageStyle}
        resizeMode="cover"
      >
        {/* Gradiente de abajo para que el texto sea legible */}
        <LinearGradient
          colors={meta.gradientColors}
          locations={[0, 0.45, 1]}
          style={styles.gradient}
        >
          {/* Badge en esquina superior derecha */}
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: meta.badgeColor }]}>
              <Text style={[styles.badgeText, { color: meta.badgeTextColor }]}>
                {meta.badge}
              </Text>
            </View>
          </View>

          {/* Título y precio sobre la imagen */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{product.name}</Text>
            <View style={styles.priceChip}>
              <Text style={styles.priceText}>
                {product.price != null
                  ? `${product.currency ?? "PEN"} ${product.price.toFixed(2)}`
                  : "Cotización"}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* ── Cuerpo: descripción + bullets + botón ── */}
      <View style={styles.body}>
        {/* Descripción del backend */}
        {product.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description}
          </Text>
        ) : null}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Qué incluye */}
        <Text style={[styles.includesLabel, { color: colors.text }]}>
          Qué incluye
        </Text>
        {meta.includes.map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <View
              style={[styles.bulletDot, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.bulletText, { color: colors.text }]}>
              {item}
            </Text>
          </View>
        ))}

        {/* Botón */}
        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: colors.primary }]}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.selectButtonText}>Elegir este spa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

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
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
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

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  centered: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroImage: {
    width: "100%",
    height: 200,
  },
  heroImageStyle: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
  },
  gradient: {
    flex: 1,
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  badgeContainer: {
    alignItems: "flex-end",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    includeFontPadding: false,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTitle: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: "#FFFFFF",
    flex: 1,
    marginRight: Spacing.sm,
    includeFontPadding: false,
  },
  priceChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  priceText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: "#FFFFFF",
    includeFontPadding: false,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  includesLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },

  // ── Botón ─────────────────────────────────────────────────────────────────
  selectButton: {
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  selectButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
