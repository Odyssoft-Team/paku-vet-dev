/**
 * add-card.tsx
 *
 * Pantalla para agregar una nueva tarjeta — integración Culqi.
 *
 * Cómo funciona:
 * 1. El usuario llena un formulario nativo (número, nombre, vencimiento, CVV).
 * 2. Al confirmar, los datos se tokenizan DIRECTAMENTE con Culqi
 *    via fetch a secure.culqi.com — nunca pasan por el backend propio.
 * 3. Con el token generamos la tarjeta en Culqi (POST /api/culqi/cards),
 *    que la asocia al customer del usuario.
 * 4. Volvemos a la pantalla anterior.
 *
 * NOTA: A diferencia de la integración anterior con Mercado Pago,
 * ya no se necesita WebView — la tokenización es nativa via fetch.
 *
 * PREREQUISITO: El usuario debe tener ya un culqi_customer_id
 * en su perfil (creado en el primer uso). Si no lo tiene,
 * se crea automáticamente en este flujo.
 */

import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/common/Text";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Icon } from "@/components/common";
import { Button } from "@/components/common/Button";
import {
  paymentService,
  getPaymentErrorMessage,
} from "@/api/services/payment.service";
import { useAuthStore } from "@/store/authStore";
import type { CardData } from "@/types/payment.types";

// ─── Preview de tarjeta nativa ─────────────────────────────────────────────────

type CardBrand = "visa" | "mastercard" | "amex" | "other";

function detectBrandFromNumber(cardNumber: string): CardBrand {
  const n = cardNumber.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "other";
}

function getBrandBgColor(brand: CardBrand): string {
  if (brand === "mastercard") return "#2C2C2C";
  if (brand === "amex") return "#007B5E";
  if (brand === "visa") return "#1D2AD8";
  return "#4A4A6A";
}

function getBrandLabel(brand: CardBrand) {
  if (brand === "visa") return "VISA";
  if (brand === "mastercard") return "MC";
  if (brand === "amex") return "AMEX";
  return "CARD";
}

const CardPreview: React.FC<{
  brand: CardBrand;
  last4?: string;
  holderName?: string;
  expMonth?: string;
  expYear?: string;
}> = ({ brand, last4, holderName, expMonth, expYear }) => (
  <View style={[cardStyles.card, { backgroundColor: getBrandBgColor(brand) }]}>
    <View style={cardStyles.circle1} />
    <View style={cardStyles.circle2} />
    <View style={cardStyles.topRow}>
      <View style={cardStyles.chip}>
        <View style={cardStyles.chipLine} />
        <View style={cardStyles.chipLine} />
        <View style={cardStyles.chipLine} />
      </View>
      <Text style={cardStyles.brandLabel}>{getBrandLabel(brand)}</Text>
    </View>
    <Text style={cardStyles.number}>
      {last4 ? `•••• •••• •••• ${last4}` : "•••• •••• •••• ••••"}
    </Text>
    <View style={cardStyles.bottomRow}>
      <View>
        <Text style={cardStyles.metaLabel}>TITULAR</Text>
        <Text style={cardStyles.metaValue}>
          {holderName?.toUpperCase() || "NOMBRE TITULAR"}
        </Text>
      </View>
      <View>
        <Text style={cardStyles.metaLabel}>VENCE</Text>
        <Text style={cardStyles.metaValue}>
          {expMonth && expYear ? `${expMonth}/${expYear.slice(-2)}` : "MM/AA"}
        </Text>
      </View>
    </View>
  </View>
);

const cardStyles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 1.586,
    borderRadius: 16,
    padding: 20,
    justifyContent: "space-between",
    overflow: "hidden",
    ...Shadows.lg,
  },
  circle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: -30,
  },
  circle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
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
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F0C040",
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
  },
  chipLine: { width: 24, height: 1, backgroundColor: "#C8962A" },
  brandLabel: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: "#FFF",
    letterSpacing: 2,
  },
  number: {
    fontSize: 16,
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
    fontSize: 12,
    fontFamily: Typography.fontFamily.semibold,
    color: "#FFF",
    marginTop: 1,
  },
});

// ─── Helpers de formato ────────────────────────────────────────────────────────

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

// ─── Pantalla principal ────────────────────────────────────────────────────────

export default function AddCardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState(""); // "MM/AA"
  const [cvv, setCvv] = useState("");
  const [saving, setSaving] = useState(false);

  // Refs para avanzar entre campos con el teclado
  const nameRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  const brand = detectBrandFromNumber(cardNumber);
  const last4 = cardNumber.replace(/\s/g, "").slice(-4) || undefined;

  const isFormValid =
    cardNumber.replace(/\s/g, "").length >= 15 &&
    holderName.trim().length >= 2 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  const handleSave = async () => {
    if (!isFormValid) {
      Alert.alert(
        "Datos incompletos",
        "Completa todos los campos de la tarjeta.",
      );
      return;
    }

    const email = user?.email;
    if (!email) {
      Alert.alert(
        "Error",
        "No se encontró el email del usuario. Vuelve a iniciar sesión.",
      );
      return;
    }

    // Necesitamos el culqi_customer_id del usuario.
    // Si no existe aún, hay que crearlo primero en el backend.
    // TODO: obtener culqiCustomerId del perfil del usuario (user.culqi_customer_id)
    // Por ahora se asume que está disponible en el objeto user.
    const culqiCustomerId: string | undefined = (user as any)
      ?.culqi_customer_id;

    if (!culqiCustomerId) {
      Alert.alert(
        "Configuración pendiente",
        "Tu cuenta aún no tiene un perfil de pagos. Contacta a soporte.",
      );
      return;
    }

    // Parsear vencimiento "MM/AA" o "MM/AAAA"
    const [expMonth, expYearShort] = expiry.split("/");
    const expYear =
      expYearShort.length === 2 ? `20${expYearShort}` : expYearShort;

    const cardData: CardData = {
      card_number: cardNumber.replace(/\s/g, ""),
      cvv,
      expiration_month: expMonth,
      expiration_year: expYear,
      email,
    };

    setSaving(true);
    try {
      console.log("[AddCard] Tokenizando y guardando tarjeta con Culqi...");
      const savedCard = await paymentService.saveCard(
        culqiCustomerId,
        cardData,
      );
      console.log("[AddCard] Tarjeta guardada OK:", savedCard.id);

      Alert.alert(
        "¡Tarjeta guardada!",
        "Tu tarjeta fue agregada correctamente.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (e: any) {
      console.error("[AddCard] Error al guardar tarjeta:", e?.message, e);
      const msg = getPaymentErrorMessage(e);
      Alert.alert("Error al guardar", msg);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: colors.text,
  };

  const labelStyle = {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <ScreenHeader title="Agregar tarjeta" right={{ type: "none" }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: Spacing.md,
            paddingBottom: Spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview de tarjeta */}
          <View style={{ marginBottom: Spacing.lg, marginTop: Spacing.xs }}>
            <CardPreview
              brand={brand}
              last4={last4}
              holderName={holderName}
              expMonth={expiry.split("/")[0]}
              expYear={expiry.split("/")[1]}
            />
          </View>

          {/* Formulario nativo */}
          <View
            style={{
              borderRadius: BorderRadius.xl,
              overflow: "hidden",
              backgroundColor: colors.surface,
              padding: Spacing.md,
              ...Shadows.md,
            }}
          >
            {/* Número de tarjeta */}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={labelStyle}>Número de tarjeta</Text>
              <TextInput
                style={inputStyle}
                value={cardNumber}
                onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.textSecondary + "88"}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => nameRef.current?.focus()}
                maxLength={19}
                autoComplete="cc-number"
              />
            </View>

            {/* Nombre del titular */}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={labelStyle}>Nombre del titular</Text>
              <TextInput
                ref={nameRef}
                style={inputStyle}
                value={holderName}
                onChangeText={setHolderName}
                placeholder="Como aparece en la tarjeta"
                placeholderTextColor={colors.textSecondary + "88"}
                returnKeyType="next"
                onSubmitEditing={() => expiryRef.current?.focus()}
                autoCapitalize="characters"
                autoComplete="cc-name"
              />
            </View>

            {/* Vencimiento + CVV en fila */}
            <View
              style={{
                flexDirection: "row",
                gap: Spacing.sm,
                marginBottom: Spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Vencimiento</Text>
                <TextInput
                  ref={expiryRef}
                  style={inputStyle}
                  value={expiry}
                  onChangeText={(v) => setExpiry(formatExpiry(v))}
                  placeholder="MM/AA"
                  placeholderTextColor={colors.textSecondary + "88"}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => cvvRef.current?.focus()}
                  maxLength={5}
                  autoComplete="cc-exp"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>CVV</Text>
                <TextInput
                  ref={cvvRef}
                  style={inputStyle}
                  value={cvv}
                  onChangeText={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
                  placeholder="•••"
                  placeholderTextColor={colors.textSecondary + "88"}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={4}
                  secureTextEntry
                  autoComplete="cc-csc"
                />
              </View>
            </View>

            {/* Separador + seguridad */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                opacity: 0.5,
                marginBottom: Spacing.md,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginBottom: Spacing.md,
              }}
            >
              <Text style={{ fontSize: 12, opacity: 0.45 }}>🔒</Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  opacity: 0.55,
                  fontFamily: Typography.fontFamily.regular,
                }}
              >
                Cifrado SSL · Culqi
              </Text>
            </View>

            {/* Botón guardar */}
            <Button
              title={saving ? "Guardando..." : "Guardar tarjeta"}
              onPress={handleSave}
              fullWidth
              loading={saving}
              disabled={!isFormValid || saving}
              style={{ borderRadius: BorderRadius.full }}
            />
          </View>

          {/* Nota de privacidad */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: Spacing.xs,
              marginTop: Spacing.md,
            }}
          >
            <Icon name="eye-closed" size={12} color={colors.textSecondary} />
            <Text
              style={{
                fontSize: 11,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textSecondary,
                opacity: 0.6,
              }}
            >
              Nunca almacenamos los datos de tu tarjeta
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Overlay guardando */}
      {saving && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <ActivityIndicator color="#FFF" size="large" />
          <Text
            style={{
              marginTop: Spacing.md,
              color: "#FFF",
              fontFamily: Typography.fontFamily.semibold,
              fontSize: Typography.fontSize.sm,
            }}
          >
            Guardando tarjeta...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
