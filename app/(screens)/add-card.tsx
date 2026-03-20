import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Icon } from "@/components/common";

// ─── Helpers de formateo ───────────────────────────────────────────────────────

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

function detectBrand(number: string): "visa" | "mastercard" | "amex" | "other" {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "other";
}

function getBrandColor(brand: ReturnType<typeof detectBrand>): string {
  switch (brand) {
    case "visa":
      return "#1D2AD8";
    case "mastercard":
      return "#EB001B";
    case "amex":
      return "#007B5E";
    default:
      return "#6B7280";
  }
}

function getBrandLabel(brand: ReturnType<typeof detectBrand>): string {
  switch (brand) {
    case "visa":
      return "VISA";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "Amex";
    default:
      return "";
  }
}

// ─── Preview de tarjeta ────────────────────────────────────────────────────────

const CardPreview: React.FC<{
  number: string;
  name: string;
  expiry: string;
  brand: ReturnType<typeof detectBrand>;
}> = ({ number, name, expiry, brand }) => {
  const displayNumber = number || "•••• •••• •••• ••••";
  const displayName = name || "NOMBRE TITULAR";
  const displayExpiry = expiry || "MM/AA";
  const [topColor, bottomColor] =
    brand === "mastercard"
      ? ["#2C2C2C", "#1A1A1A"]
      : brand === "amex"
        ? ["#007B5E", "#004D3B"]
        : ["#1D2AD8", "#0A0F6B"];

  const styles = StyleSheet.create({
    card: {
      width: "100%",
      aspectRatio: 1.586,
      borderRadius: 16,
      padding: 20,
      justifyContent: "space-between",
      backgroundColor: topColor,
      ...Shadows.lg,
      overflow: "hidden",
    },
    circle1: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: "rgba(255,255,255,0.05)",
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
    chipLine: {
      width: 24,
      height: 1,
      backgroundColor: "#C8962A",
    },
    brandLabel: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.black,
      color: "#FFFFFF",
      letterSpacing: brand === "visa" ? 2 : 0,
      fontStyle: brand === "visa" ? "italic" : "normal",
    },
    mcCircles: { flexDirection: "row" },
    mcCircle1: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "#EB001B",
    },
    mcCircle2: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "#F79E1B",
      marginLeft: -9,
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
  });

  return (
    <View style={styles.card}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.topRow}>
        <View style={styles.chip}>
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
        </View>
        {brand === "mastercard" ? (
          <View style={styles.mcCircles}>
            <View style={styles.mcCircle1} />
            <View style={styles.mcCircle2} />
          </View>
        ) : (
          <Text style={styles.brandLabel}>{getBrandLabel(brand)}</Text>
        )}
      </View>

      <Text style={styles.number}>{displayNumber}</Text>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.label}>Titular</Text>
          <Text style={styles.value}>
            {displayName.toUpperCase().slice(0, 20)}
          </Text>
        </View>
        <View>
          <Text style={styles.label}>Vence</Text>
          <Text style={styles.value}>{displayExpiry}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Pantalla principal ────────────────────────────────────────────────────────

export default function AddCardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [loading, setLoading] = useState(false);

  // Campos del formulario
  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Android: listener manual para teclado
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const brand = detectBrand(cardNumber);

  const handleSave = async () => {
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 16) {
      Alert.alert("Error", "Ingresa un número de tarjeta válido (16 dígitos)");
      return;
    }
    if (!holderName.trim()) {
      Alert.alert("Error", "Ingresa el nombre del titular");
      return;
    }
    if (expiry.length < 5) {
      Alert.alert("Error", "Ingresa la fecha de vencimiento (MM/AA)");
      return;
    }
    if (cvv.length < 3) {
      Alert.alert("Error", "Ingresa el CVV (3 o 4 dígitos)");
      return;
    }

    setLoading(true);
    // TODO: conectar con backend MP cuando esté listo
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);

    Alert.alert(
      "¡Tarjeta guardada!",
      "Tu tarjeta fue agregada correctamente.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    previewWrapper: {
      marginBottom: Spacing.lg,
      marginTop: Spacing.sm,
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
    row: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    secureRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xs,
      marginTop: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    secureText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
    },
    fixedButton: {
      padding: Spacing.md,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border + "30",
    },
  });

  const formContent = (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview de tarjeta en tiempo real */}
        <View style={styles.previewWrapper}>
          <CardPreview
            number={cardNumber}
            name={holderName}
            expiry={expiry}
            brand={brand}
          />
        </View>

        <Text style={styles.sectionLabel}>Datos de la tarjeta</Text>

        {/* Número */}
        <Input
          label="Número de tarjeta"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChangeText={(t) => setCardNumber(formatCardNumber(t))}
          keyboardType="numeric"
          maxLength={19}
          returnKeyType="next"
        />

        {/* Titular */}
        <Input
          label="Nombre del titular"
          placeholder="Como aparece en la tarjeta"
          value={holderName}
          onChangeText={setHolderName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* Vencimiento + CVV en fila */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Vencimiento"
              placeholder="MM/AA"
              value={expiry}
              onChangeText={(t) => setExpiry(formatExpiry(t))}
              keyboardType="numeric"
              maxLength={5}
              returnKeyType="next"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="CVV"
              placeholder="123"
              value={cvv}
              onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              returnKeyType="done"
              type="password"
            />
          </View>
        </View>

        {/* Texto de seguridad */}
        <View style={styles.secureRow}>
          <Icon name="eye-closed" size={13} color={colors.textSecondary} />
          <Text style={styles.secureText}>
            Tus datos están cifrados y protegidos con SSL
          </Text>
        </View>
      </ScrollView>

      <View style={styles.fixedButton}>
        <Button
          title="Guardar tarjeta"
          onPress={handleSave}
          fullWidth
          loading={loading}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScreenHeader title="Agregar tarjeta" right={{ type: "none" }} />
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {formContent}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
          {formContent}
        </View>
      )}
    </SafeAreaView>
  );
}
