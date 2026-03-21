import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  ImageSourcePropType,
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

// ─── Contenido estático por posición de producto ─────────────────────────────
// El backend entrega nombre, precio y descripción.
// Los bullets y badge se mapean por índice (0 = clásico, 1 = premium, 2 = express).

interface ServiceMeta {
  badge: string;
  badgeColor: string;
  includes: string[];
  image: ImageSourcePropType;
}

const SERVICE_META: ServiceMeta[] = [
  {
    badge: "Recomendado",
    badgeColor: "#FFB6C1",
    includes: [
      "Limpieza completa y segura.",
      "Cuidado básico de uñas y oídos.",
      "Brillo y frescura inmediata.",
    ],
    image: require("@assets/images/profile/profile-pet.png"),
  },
  {
    badge: "Pelo largo",
    badgeColor: "#B6D4FF",
    includes: [
      "Hidratación profunda del pelaje.",
      "Mascarilla nutritiva y acabado superior.",
      "Suavidad y brillo prolongado.",
    ],
    image: require("@assets/images/services/banner-service-1.png"),
  },
  {
    badge: "Cachorros",
    badgeColor: "#B6FFD4",
    includes: [
      "Shampoo en seco hipoalergénico.",
      "Ideal entre baños o para cachorros hasta los 4 meses.",
      "Frescura inmediata.",
    ],
    image: require("@assets/images/services/banner-service-1.png"),
  },
];

// ─── Card de servicio ─────────────────────────────────────────────────────────

const ProductCard: React.FC<{
  product: StoreProduct;
  index: number;
  onPress: () => void;
}> = ({ product, index, onPress }) => {
  const { colors } = useTheme();
  const meta = SERVICE_META[index] ?? SERVICE_META[0];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Imagen de fondo con overlay suave */}
      <ImageBackground
        source={meta.image}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
        resizeMode="cover"
      >
        <View style={styles.imageOverlay} />
      </ImageBackground>

      {/* Contenido */}
      <View style={styles.cardBody}>
        {/* Título + badge */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.primary }]}>
            {product.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: meta.badgeColor }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {meta.badge}
            </Text>
          </View>
        </View>

        {/* Descripción del backend */}
        {product.description ? (
          <Text style={[styles.description, { color: colors.text }]}>
            {product.description}
          </Text>
        ) : null}

        {/* Precio */}
        <Text style={[styles.price, { color: colors.primary }]}>
          {product.price != null
            ? `Costo: ${product.currency ?? "S/"} ${product.price.toFixed(2)}`
            : "Precio según cotización"}
        </Text>

        {/* Incluye */}
        <Text style={[styles.includesLabel, { color: colors.primary }]}>
          Incluye:
        </Text>
        {meta.includes.map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.text }]}>
              {item}
            </Text>
          </View>
        ))}

        {/* Botón */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Elegir este spa"
            onPress={onPress}
            fullWidth
            style={styles.button}
          />
        </View>
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

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
  centered: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  cardImage: {
    width: "100%",
    height: 130,
  },
  cardImageStyle: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  cardBody: {
    padding: Spacing.lg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },

  // ── Precio ────────────────────────────────────────────────────────────────
  price: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
  },

  // ── Incluye ───────────────────────────────────────────────────────────────
  includesLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: Spacing.xs,
  },
  bullet: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },

  // ── Botón ─────────────────────────────────────────────────────────────────
  buttonWrapper: {
    marginTop: Spacing.md,
  },
  button: {
    borderRadius: BorderRadius.full,
  },
});
