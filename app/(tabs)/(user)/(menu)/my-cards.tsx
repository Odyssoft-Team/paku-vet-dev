/**
 * my-cards.tsx
 *
 * Pantalla "Mis tarjetas" — gestión de tarjetas guardadas.
 *
 * Conectada al backend de Mercado Pago:
 * - Lista tarjetas reales con paymentService.listCards()
 * - Navega a add-card para agregar nuevas (que hace el tokenizado con MP SDK)
 *
 * Nota: el backend actual no expone endpoints de delete ni set-default,
 * por lo que esas opciones están deshabilitadas hasta que el backend las implemente.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useCartDrawerStore } from "@/store/cartDrawerStore";
import { useSavedCards } from "@/hooks/useSavedCards";
import { SavedPaymentMethod } from "@/types/payment.types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getBrandLabel(brand: string): string {
  const b = brand.toLowerCase();
  if (b.includes("visa")) return "VISA";
  if (b.includes("master")) return "Mastercard";
  if (b.includes("amex")) return "Amex";
  return brand.toUpperCase();
}

function getBrandShort(brand: string): string {
  const b = brand.toLowerCase();
  if (b.includes("visa")) return "VISA";
  if (b.includes("master")) return "MC";
  if (b.includes("amex")) return "AMEX";
  return brand.toUpperCase().slice(0, 4);
}

function getCardBgColor(brand: string): string {
  const b = brand.toLowerCase();
  if (b.includes("visa")) return "#1D2AD8";
  if (b.includes("master")) return "#2C2C2C";
  if (b.includes("amex")) return "#007B5E";
  return "#374151";
}

function isMastercard(brand: string) {
  return brand.toLowerCase().includes("master");
}

// ─── Componente: Tarjeta física ────────────────────────────────────────────────

const CreditCard: React.FC<{
  card: SavedPaymentMethod;
  onOptions: () => void;
}> = ({ card, onOptions }) => {
  const bgColor = getCardBgColor(card.brand);
  const mc = isMastercard(card.brand);

  return (
    <View style={[cardStyles.card, { backgroundColor: bgColor }]}>
      <View style={cardStyles.circle1} />
      <View style={cardStyles.circle2} />

      <View style={cardStyles.topRow}>
        <View style={cardStyles.chip}>
          <View style={cardStyles.chipLine} />
          <View style={cardStyles.chipLine} />
          <View style={cardStyles.chipLine} />
        </View>
        <TouchableOpacity style={cardStyles.optionsBtn} onPress={onOptions}>
          <Icon name="pencil" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text style={cardStyles.number}>•••• •••• •••• {card.last4}</Text>

      <View style={cardStyles.bottomRow}>
        <View>
          <Text style={cardStyles.metaLabel}>Vence</Text>
          <Text style={cardStyles.metaValue}>
            {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
          </Text>
        </View>
        {mc ? (
          <View style={cardStyles.mcCircles}>
            <View style={cardStyles.mcCircle1} />
            <View style={cardStyles.mcCircle2} />
          </View>
        ) : (
          <Text style={cardStyles.brandText}>{getBrandShort(card.brand)}</Text>
        )}
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 2.8,
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-between",
    overflow: "hidden",
    ...Shadows.lg,
  },
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
    gap: 3,
  },
  chipLine: { width: 24, height: 1, backgroundColor: "#C8962A" },
  optionsBtn: { padding: 4 },
  number: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: "#FFF",
    letterSpacing: 3,
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: "#FFF",
    marginTop: 1,
  },
  brandText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: "#FFF",
    letterSpacing: 2,
  },
  mcCircles: { flexDirection: "row" },
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

// ─── Bottom sheet de opciones ─────────────────────────────────────────────────

const CardOptionsSheet: React.FC<{
  visible: boolean;
  card: SavedPaymentMethod | null;
  onClose: () => void;
}> = ({ visible, card, onClose }) => {
  const { colors } = useTheme();
  if (!card) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              overflow: "hidden",
            }}
          >
            {/* Handle */}
            <View
              style={{
                alignItems: "center",
                paddingTop: Spacing.sm,
                paddingBottom: Spacing.xs,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border + "40",
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                paddingHorizontal: Spacing.lg,
                paddingBottom: Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border + "20",
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.xs,
                  fontFamily: Typography.fontFamily.semibold,
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Opciones de tarjeta
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.md,
                  fontFamily: Typography.fontFamily.bold,
                  color: colors.text,
                  marginTop: 2,
                }}
              >
                {getBrandLabel(card.brand)} •••• {card.last4}
              </Text>
            </View>

            {/* Info — delete no disponible todavía */}
            <View
              style={{
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: Spacing.sm,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="wallet" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.semibold,
                    color: colors.text,
                    marginBottom: 2,
                  }}
                >
                  {getBrandLabel(card.brand)} •••• {card.last4}
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.textSecondary,
                    lineHeight: 16,
                  }}
                >
                  Vence {String(card.exp_month).padStart(2, "0")}/
                  {card.exp_year}
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.textSecondary,
                    marginTop: 6,
                    lineHeight: 16,
                  }}
                >
                  La eliminación de tarjetas estará disponible próximamente.
                </Text>
              </View>
            </View>

            {/* Cancelar */}
            <View
              style={{
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border + "20",
              }}
            >
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  paddingVertical: Spacing.sm,
                  borderRadius: BorderRadius.md,
                  backgroundColor: colors.border + "18",
                }}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.md,
                    fontFamily: Typography.fontFamily.semibold,
                    color: colors.textSecondary,
                  }}
                >
                  Cerrar
                </Text>
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

  const { cards, loading, error, fetchCards } = useSavedCards();
  const [selectedCard, setSelectedCard] = useState<SavedPaymentMethod | null>(
    null,
  );
  const [sheetVisible, setSheetVisible] = useState(false);

  // Cargar tarjetas al entrar a la pantalla (y al volver de add-card)
  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [fetchCards]),
  );

  const openOptions = (card: SavedPaymentMethod) => {
    setSelectedCard(card);
    setSheetVisible(true);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <ScreenHeader
        title="Mis tarjetas"
        backHref="/(tabs)/(user)/profile"
        right={{ type: "icon", name: "cart", onPress: openCartDrawer }}
      />

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.md,
          paddingBottom: Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchCards}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Text
          style={{
            fontSize: Typography.fontSize.xs,
            fontFamily: Typography.fontFamily.semibold,
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: Spacing.md,
            marginTop: Spacing.sm,
          }}
        >
          Mis tarjetas
        </Text>

        {/* Estado de carga inicial */}
        {loading && cards.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: Spacing.xxl }}>
            <ActivityIndicator color={colors.primary} />
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textSecondary,
                marginTop: Spacing.sm,
              }}
            >
              Cargando tarjetas...
            </Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: Spacing.xl,
              gap: Spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.regular,
                color: colors.error || "#FF1637",
                textAlign: "center",
              }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={fetchCards}
              style={{
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.md,
                backgroundColor: colors.primary + "15",
                borderRadius: BorderRadius.full,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.semibold,
                  color: colors.primary,
                }}
              >
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Estado vacío */}
        {!loading && !error && cards.length === 0 && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: Spacing.xxl,
              gap: Spacing.sm,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.primary + "15",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: Spacing.sm,
              }}
            >
              <Icon name="wallet" size={32} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: Typography.fontSize.md,
                fontFamily: Typography.fontFamily.bold,
                color: colors.text,
              }}
            >
              Sin tarjetas guardadas
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textSecondary,
                textAlign: "center",
                maxWidth: 220,
              }}
            >
              Agrega una tarjeta para pagar tus servicios más rápido
            </Text>
          </View>
        )}

        {/* Lista de tarjetas */}
        {cards.map((card) => (
          <View key={card.id} style={{ marginBottom: Spacing.sm }}>
            <CreditCard card={card} onOptions={() => openOptions(card)} />
          </View>
        ))}

        {/* Botón agregar tarjeta */}
        <TouchableOpacity
          style={{
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
          }}
          onPress={() => router.push("/(screens)/add-card")}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary + "15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="plus" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: Typography.fontSize.md,
                fontFamily: Typography.fontFamily.semibold,
                color: colors.primary,
              }}
            >
              Agregar tarjeta
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textSecondary,
              }}
            >
              Débito o crédito
            </Text>
          </View>
          <Icon name="arrow-right" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Info de seguridad */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.md,
            marginTop: Spacing.lg,
            gap: Spacing.sm,
            ...Shadows.sm,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.bold,
              color: colors.primary,
              marginBottom: Spacing.xs,
            }}
          >
            ℹ️ Sobre tus pagos
          </Text>
          {[
            "Tus datos de tarjeta están protegidos con encriptación SSL.",
            "Puedes pagar con Visa, Mastercard o American Express.",
            "Los pagos son procesados de forma segura por Mercado Pago.",
          ].map((txt, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: Spacing.sm,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: colors.primary,
                  marginTop: 7,
                }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: Typography.fontSize.xs,
                  fontFamily: Typography.fontFamily.regular,
                  color: colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                {txt}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <CardOptionsSheet
        visible={sheetVisible}
        card={selectedCard}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
