import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useCartDrawerStore } from "@/store/cartDrawerStore";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SavedCard {
  id: string;
  last4: string;
  brand: "visa" | "mastercard" | "amex" | "other";
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

// ─── Datos mock ────────────────────────────────────────────────────────────────

const MOCK_CARDS: SavedCard[] = [
  {
    id: "card_1",
    last4: "4242",
    brand: "visa",
    holderName: "Juan Pérez",
    expiryMonth: "08",
    expiryYear: "27",
    isDefault: true,
  },
  {
    id: "card_2",
    last4: "5555",
    brand: "mastercard",
    holderName: "Juan Pérez",
    expiryMonth: "12",
    expiryYear: "26",
    isDefault: false,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getBrandLabel(brand: SavedCard["brand"]) {
  switch (brand) {
    case "visa":
      return "VISA";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "Amex";
    default:
      return "Tarjeta";
  }
}

function getCardGradient(brand: SavedCard["brand"]): [string, string] {
  switch (brand) {
    case "visa":
      return ["#1D2AD8", "#0A0F6B"];
    case "mastercard":
      return ["#2C2C2C", "#EB001B"];
    case "amex":
      return ["#007B5E", "#004D3B"];
    default:
      return ["#374151", "#1F2937"];
  }
}

// ─── Componente: Tarjeta física ────────────────────────────────────────────────

const CreditCard: React.FC<{
  card: SavedCard;
  onOptions: () => void;
}> = ({ card, onOptions }) => {
  const [topColor, bottomColor] = getCardGradient(card.brand);

  const styles = StyleSheet.create({
    card: {
      width: "100%",
      aspectRatio: 2.8, // más compacto
      borderRadius: 16,
      padding: 14,
      justifyContent: "space-between",
      overflow: "hidden",
      backgroundColor: topColor,
      ...Shadows.lg,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    chip: {
      width: 28,
      height: 22,
      borderRadius: 6,
      backgroundColor: "#F0C040",
      justifyContent: "center",
      alignItems: "center",
    },
    chipLine: {
      width: 24,
      height: 1,
      backgroundColor: "#C8962A",
      marginBottom: 3,
    },
    optionsBtn: {
      padding: 4,
    },
    defaultBadge: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    defaultText: {
      fontSize: 10,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFFFFF",
    },
    number: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      letterSpacing: 3,
      textAlign: "center",
      marginVertical: 8,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    label: {
      fontSize: 9,
      fontFamily: Typography.fontFamily.regular,
      color: "rgba(255,255,255,0.6)",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    value: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFFFFF",
      marginTop: 1,
    },
    brandText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.black,
      color: "#FFFFFF",
      letterSpacing: card.brand === "visa" ? 2 : 0,
      fontStyle: card.brand === "visa" ? "italic" : "normal",
    },
    // Círculos decorativos de fondo
    circle1: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(255,255,255,0.05)",
      top: -40,
      right: -30,
    },
    circle2: {
      position: "absolute",
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: "rgba(255,255,255,0.07)",
      bottom: -20,
      left: -20,
    },
    // Mastercard círculos
    mcCircles: {
      flexDirection: "row",
    },
    mcCircle1: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#EB001B",
    },
    mcCircle2: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#F79E1B",
      marginLeft: -8,
    },
  });

  return (
    <View style={styles.card}>
      {/* Fondo decorativo */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Fila superior */}
      <View style={styles.topRow}>
        {/* Chip */}
        <View style={styles.chip}>
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {card.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>✓ Predeterminada</Text>
            </View>
          )}
          <TouchableOpacity style={styles.optionsBtn} onPress={onOptions}>
            <Icon name="pencil" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Número */}
      <Text style={styles.number}>•••• •••• •••• {card.last4}</Text>

      {/* Fila inferior */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.label}>Titular</Text>
          <Text style={styles.value}>{card.holderName}</Text>
        </View>
        <View>
          <Text style={styles.label}>Vence</Text>
          <Text style={styles.value}>
            {card.expiryMonth}/{card.expiryYear}
          </Text>
        </View>
        {/* Logo de la marca */}
        {card.brand === "mastercard" ? (
          <View style={styles.mcCircles}>
            <View style={styles.mcCircle1} />
            <View style={styles.mcCircle2} />
          </View>
        ) : (
          <Text style={styles.brandText}>{getBrandLabel(card.brand)}</Text>
        )}
      </View>
    </View>
  );
};

// ─── Componente: Bottom Sheet de opciones ──────────────────────────────────────

const CardOptionsSheet: React.FC<{
  visible: boolean;
  card: SavedCard | null;
  onClose: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}> = ({ visible, card, onClose, onSetDefault, onDelete }) => {
  const { colors } = useTheme();

  if (!card) return null;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    sheetWrapper: {
      width: "100%",
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      overflow: "hidden",
    },
    handle: {
      alignItems: "center",
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border + "40",
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "20",
    },
    headerLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    headerTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
      marginTop: 2,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: 15,
      gap: Spacing.md,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    optionText: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.medium,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border + "18",
      marginHorizontal: Spacing.lg,
    },
    cancelRow: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border + "20",
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.border + "18",
    },
    cancelText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.textSecondary,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            <View style={styles.handle}>
              <View style={styles.handleBar} />
            </View>

            <View style={styles.header}>
              <Text style={styles.headerLabel}>Opciones de tarjeta</Text>
              <Text style={styles.headerTitle}>
                •••• {card.last4} — {getBrandLabel(card.brand)}
              </Text>
            </View>

            {!card.isDefault && (
              <>
                <TouchableOpacity
                  style={styles.option}
                  onPress={onSetDefault}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: "#1D2AD815" },
                    ]}
                  >
                    <Icon name="check" size={18} color="#1D2AD8" />
                  </View>
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    Marcar como predeterminada
                  </Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            <TouchableOpacity
              style={styles.option}
              onPress={onDelete}
              activeOpacity={0.6}
            >
              <View
                style={[styles.optionIcon, { backgroundColor: "#FF163715" }]}
              >
                <Icon name="close" size={18} color="#FF1637" />
              </View>
              <Text style={[styles.optionText, { color: "#FF1637" }]}>
                Eliminar tarjeta
              </Text>
            </TouchableOpacity>

            <View style={styles.cancelRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Pantalla principal ────────────────────────────────────────────────────────

export default function MyCardsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { open: openCartDrawer } = useCartDrawerStore();

  const [cards, setCards] = useState<SavedCard[]>(MOCK_CARDS);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const openOptions = (card: SavedCard) => {
    setSelectedCard(card);
    setSheetVisible(true);
  };

  const handleSetDefault = () => {
    if (!selectedCard) return;
    setCards((prev) =>
      prev.map((c) => ({ ...c, isDefault: c.id === selectedCard.id })),
    );
    setSheetVisible(false);
  };

  const handleDelete = () => {
    if (!selectedCard) return;
    setSheetVisible(false);
    setTimeout(() => {
      Alert.alert(
        "Eliminar tarjeta",
        `¿Eliminar la tarjeta terminada en ${selectedCard.last4}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              setCards((prev) => prev.filter((c) => c.id !== selectedCard.id));
            },
          },
        ],
      );
    }, 300);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    sectionLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: Spacing.md,
      marginTop: Spacing.sm,
    },
    cardWrapper: {
      marginBottom: Spacing.sm,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: Spacing.xxl,
      gap: Spacing.sm,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.sm,
    },
    emptyTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      maxWidth: 220,
    },
    addButton: {
      marginTop: Spacing.lg,
    },
    // Sección info de pagos
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginTop: Spacing.lg,
      gap: Spacing.sm,
      ...Shadows.sm,
    },
    infoTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    infoDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 7,
    },
    infoText: {
      flex: 1,
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    // Botón agregar abajo
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginTop: Spacing.sm,
      borderWidth: 1.5,
      borderColor: colors.primary + "40",
      borderStyle: "dashed",
      ...Shadows.sm,
    },
    addIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    addRowText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
    },
    addRowSub: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Pagos y facturación"
        backHref="/(tabs)/(user)/profile"
        right={{ type: "icon", name: "cart", onPress: openCartDrawer }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Mis tarjetas</Text>

        {cards.length === 0 ? (
          /* Estado vacío */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Icon name="wallet" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin tarjetas guardadas</Text>
            <Text style={styles.emptySubtitle}>
              Agrega una tarjeta para pagar tus servicios más rápido
            </Text>
          </View>
        ) : (
          /* Lista de tarjetas */
          cards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              <CreditCard card={card} onOptions={() => openOptions(card)} />
            </View>
          ))
        )}

        {/* Botón agregar tarjeta */}
        <TouchableOpacity
          style={styles.addRow}
          onPress={() => router.push("/(screens)/add-card")}
          activeOpacity={0.7}
        >
          <View style={styles.addIconCircle}>
            <Icon name="plus" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addRowText}>Agregar tarjeta</Text>
            <Text style={styles.addRowSub}>Débito o crédito</Text>
          </View>
          <Icon name="arrow-right" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Info de seguridad */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Sobre tus pagos</Text>
          {[
            "Tus datos de tarjeta están protegidos con encriptación SSL.",
            "Puedes pagar con Visa, Mastercard o American Express.",
            "Los pagos son procesados de forma segura por MercadoPago.",
          ].map((txt, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.infoDot} />
              <Text style={styles.infoText}>{txt}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <CardOptionsSheet
        visible={sheetVisible}
        card={selectedCard}
        onClose={() => setSheetVisible(false)}
        onSetDefault={handleSetDefault}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}
