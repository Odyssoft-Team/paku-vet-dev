import React, { useState, useMemo } from "react";
import { useOrderStore } from "@/store/orderStore";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useBookingStore } from "@/store/bookingStore";
import { useAddressStore } from "@/store/addressStore";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { CreateCartItemInput } from "@/types/cart.types";
import { cartService } from "@/api/services/cart.service";
import { orderService } from "@/api/services/order.service";

// ─── Tipos de tarjeta guardada (mock mientras llega el backend) ────────────────

interface SavedCard {
  id: string;
  last4: string;
  brand: "visa" | "mastercard" | "amex";
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

const SAVED_CARDS: SavedCard[] = [
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

function getBrandColor(brand: SavedCard["brand"]): string {
  if (brand === "visa") return "#1D2AD8";
  if (brand === "mastercard") return "#EB001B";
  return "#007B5E";
}

function getBrandLabel(brand: SavedCard["brand"]): string {
  if (brand === "visa") return "VISA";
  if (brand === "mastercard") return "Mastercard";
  return "Amex";
}

type PaymentMethod = "card" | "yape" | null;

const COUPON_DISCOUNT = 20;

type CardFormValues = {
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardName: string;
  cardLastName: string;
  cardEmail: string;
};

type YapeFormValues = {
  yapePhone: string;
  yapeCode: string;
};

// ─── Coupon Modal ──────────────────────────────────────────────────────────────

const CouponModal = ({ visible, onClose, onApply, colors }: any) => {
  const [code, setCode] = useState("");
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: Spacing.lg,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableOpacity activeOpacity={1}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: BorderRadius.xxl,
                padding: Spacing.lg,
                width: 320,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: Spacing.md,
                  gap: Spacing.md,
                }}
              >
                <Text
                  style={{
                    fontFamily: Typography.fontFamily.semibold,
                    fontSize: Typography.fontSize.md,
                    color: colors.primary,
                    flex: 1,
                  }}
                >
                  Agregar cupón
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: BorderRadius.md,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 10,
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.text,
                    backgroundColor: colors.background,
                    includeFontPadding: false,
                    textAlignVertical: "center",
                  }}
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  autoFocus
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: BorderRadius.full,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
                onPress={() => {
                  if (code.trim()) onApply(code.trim().toUpperCase());
                  setCode("");
                }}
              >
                <Text
                  style={{
                    color: "#FFF",
                    fontFamily: Typography.fontFamily.semibold,
                    fontSize: Typography.fontSize.md,
                  }}
                >
                  Aplicar
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Success Modal ─────────────────────────────────────────────────────────────

const SuccessModal = ({ visible, onGoHome, colors }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.xxl,
          padding: Spacing.xl,
          width: "100%",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: Typography.fontFamily.bold,
            fontSize: Typography.fontSize.lg,
            color: colors.primary,
            textAlign: "center",
            marginBottom: Spacing.lg,
          }}
        >
          ¡Tu pago se realizó con éxito!
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: BorderRadius.full,
            paddingVertical: Spacing.md,
            width: "100%",
            alignItems: "center",
          }}
          onPress={onGoHome}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: Typography.fontFamily.semibold,
              fontSize: Typography.fontSize.md,
            }}
          >
            Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function CartScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setOrder } = useOrderStore();

  const {
    productName,
    productId,
    quotedTotal,
    currency,
    selectedAddonIds,
    petId,
    selectedDate,
    selectedTime,
    addressId,
    appliedCoupon,
    couponDiscount,
    needsInvoice,
    invoiceData,
    applyCoupon,
    removeCoupon,
    removeInvoice,
    clearBooking,
    setCartId,
  } = useBookingStore();

  const { addresses } = useAddressStore();
  const selectedAddress = addressId
    ? addresses.find((a) => a.id === addressId)
    : addresses.find((a) => a.is_default);
  const addressLabel = selectedAddress
    ? `${selectedAddress.address_line} ${selectedAddress.building_number}`
    : "Sin dirección";

  const [couponVisible, setCouponVisible] = useState(false);
  const [invoiceOption, setInvoiceOption] = useState<"si" | "no">(
    needsInvoice ? "si" : "no",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    SAVED_CARDS.find((c) => c.isDefault)?.id ?? null,
  );
  const [successVisible, setSuccessVisible] = useState(false);
  const [paying, setPaying] = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  // RHF — tarjeta
  const {
    control: cardControl,
    handleSubmit: handleCardSubmit,
    formState: { errors: cardErrors },
  } = useForm<CardFormValues>({
    defaultValues: {
      cardNumber: "",
      cardExpiry: "",
      cardCvv: "",
      cardName: "",
      cardLastName: "",
      cardEmail: "",
    },
  });

  // RHF — yape
  const {
    control: yapeControl,
    handleSubmit: handleYapeSubmit,
    formState: { errors: yapeErrors },
  } = useForm<YapeFormValues>({
    defaultValues: { yapePhone: "", yapeCode: "" },
  });

  const subtotal = useMemo(() => {
    return (quotedTotal ?? 0) - couponDiscount;
  }, [quotedTotal, couponDiscount]);

  const handleInvoiceToggle = (option: "si" | "no") => {
    setInvoiceOption(option);
    if (option === "si") {
      router.push("/(tabs)/(user)/invoice-form");
    } else {
      removeInvoice();
    }
  };

  const processPayment = async () => {
    setPaying(true);
    try {
      const items: CreateCartItemInput[] = [
        {
          kind: "service_base",
          ref_id: productId!,
          name: productName!,
          qty: 1,
          unit_price: quotedTotal!,
          meta: {
            pet_id: petId!,
            scheduled_date: selectedDate!,
            scheduled_time: selectedTime ?? "12:00",
            addon_ids: selectedAddonIds, // ← addons viajan en meta
          },
        },
      ];

      const cartResponse = await cartService.createWithItems({ items });
      const newCartId = cartResponse.cart.id;
      setCartId(newCartId);

      await cartService.checkout(newCartId);

      const newOrder = await orderService.createOrder({
        cart_id: newCartId,
        address_id: addressId!,
      });

      setOrder(newOrder);
      setSuccessVisible(true);
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        (Array.isArray(error.response?.data?.errors)
          ? error.response.data.errors.join("\n")
          : null) ||
        "Ocurrió un error al procesar tu pago. Intenta nuevamente.";
      Alert.alert("Error al procesar", message);
    } finally {
      setPaying(false);
    }
  };

  const handlePay = () => {
    if (!paymentMethod) return;
    if (paymentMethod === "card") {
      handleCardSubmit(() => processPayment())();
    } else {
      handleYapeSubmit(() => processPayment())();
    }
  };

  const handleGoHome = () => {
    setSuccessVisible(false);
    clearBooking();
    router.replace("/(tabs)/(user)/");
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      position: "relative",
      backgroundColor: colors.primary,
    },
    backButton: {
      position: "absolute",
      left: Spacing.md,
      width: 40,
    },
    headerTitle: {
      color: "#FFFFFF",
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      textAlign: "center",
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 150 },
    addressBar: {
      backgroundColor: colors.surface,
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      ...Shadows.sm,
    },
    addressText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.sm,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.sm,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.xs,
    },
    summaryLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      flex: 1,
      paddingRight: Spacing.sm,
    },
    summaryValue: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
    },
    couponRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginBottom: Spacing.xs,
      gap: Spacing.xs,
    },
    couponText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
    },
    couponApplied: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: colors.primary,
    },
    couponLink: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: colors.textSecondary,
    },
    couponRemove: {
      fontSize: Typography.fontSize.xs,
      color: colors.error,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border + "40",
      marginVertical: Spacing.sm,
    },
    subtotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    subtotalLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    subtotalValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    invoiceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    invoiceLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    radioGroup: { flexDirection: "row", gap: Spacing.md },
    radioOption: { flexDirection: "row", alignItems: "center", gap: 6 },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    radioLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
    },
    invoiceData: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    paymentTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.sm,
    },
    paymentOptions: { flexDirection: "row", gap: Spacing.sm },
    payCard: {
      flex: 1,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 72,
      borderWidth: 2,
    },
    payCardSel: { borderColor: colors.primary },
    payCardUnsel: { borderColor: colors.border + "50", borderStyle: "dashed" },
    payCardLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: Spacing.xs,
    },
    yapeCard: {
      flex: 1,
      borderRadius: BorderRadius.lg,
      backgroundColor: "#6B21A8",
      minHeight: 72,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    yapeCardSel: { borderColor: "#FFF" },
    yapeCardUnsel: { borderColor: "transparent" },
    yapeText: {
      color: "#FFF",
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      fontStyle: "italic",
    },
    form: { marginTop: Spacing.md },
    formRow: { flexDirection: "row", gap: Spacing.sm },
    halfField: { flex: 1 },
    rememberRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: Spacing.xs,
      gap: Spacing.sm,
      backgroundColor: colors.primary + "12",
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: BorderRadius.sm,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    rememberLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      flex: 1,
    },
    yapeAmountLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    yapeDesc: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
      lineHeight: 20,
    },
    fixedBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border + "30",
      ...Shadows.lg,
    },
    addReservaBtn: {
      borderWidth: 1,
      borderColor: colors.secondary,
      backgroundColor: colors.secondary + "25",
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.sm,
      gap: Spacing.xs,
    },
    // ── Tarjetas guardadas ────────────────────────────────────────────────
    savedCardsLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: Spacing.sm,
    },
    savedCardRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      gap: Spacing.md,
      backgroundColor: colors.background,
    },
    cardBrandBadge: {
      width: 40,
      height: 28,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    cardBrandText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      letterSpacing: 0.5,
    },
    cardRowNumber: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      letterSpacing: 0.5,
    },
    cardRowExpiry: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    addNewCardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginTop: Spacing.xs,
      backgroundColor: colors.primary + "0D",
      borderWidth: 1,
      borderColor: colors.primary + "30",
      borderStyle: "dashed",
    },
    addNewCardIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    addReservaText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}

      <ScreenHeader
        title="Tu carrito"
        backHref="/(tabs)/(user)/"
        // right={{
        //   type: "icon",
        //   name: "cart",
        //   onPress: () => router.push("/(tabs)/(user)/cart"),
        // }}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dirección */}
        <View style={s.addressBar}>
          <Text style={s.addressText}>{addressLabel}</Text>
        </View>

        {/* ── Resumen ──────────────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Resumen</Text>

          {productName && quotedTotal != null && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>• PAKU Spa - {productName}</Text>
              <Text style={s.summaryValue}>
                {currency} {quotedTotal.toFixed(2)}
              </Text>
            </View>
          )}

          {selectedAddonIds.length > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>
                • {selectedAddonIds.length} adicional
                {selectedAddonIds.length > 1 ? "es" : ""}
              </Text>
              <Text style={s.summaryValue}>Incluido</Text>
            </View>
          )}

          <View style={s.couponRow}>
            <Icon name="ticket" size={16} color={colors.textSecondary} />
            <Text style={s.couponText}>¿Tienes un cupón?</Text>
            {appliedCoupon ? (
              <>
                <Text style={s.couponApplied}>
                  {appliedCoupon} (-S/{COUPON_DISCOUNT})
                </Text>
                <TouchableOpacity onPress={removeCoupon}>
                  <Text style={s.couponRemove}>✕</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setCouponVisible(true)}>
                <Text style={s.couponLink}>Agregar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.divider} />

          <View style={s.subtotalRow}>
            <Text style={s.subtotalLabel}>Subtotal</Text>
            <Text style={s.subtotalValue}>S/{subtotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Factura ───────────────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.invoiceRow}>
            <Text style={s.invoiceLabel}>¿Necesitas factura?</Text>
            <View style={s.radioGroup}>
              {(["si", "no"] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={s.radioOption}
                  onPress={() => handleInvoiceToggle(opt)}
                >
                  <View
                    style={[
                      s.radioOuter,
                      {
                        borderColor:
                          invoiceOption === opt
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    {invoiceOption === opt && <View style={s.radioInner} />}
                  </View>
                  <Text style={s.radioLabel}>{opt === "si" ? "Sí" : "No"}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {invoiceOption === "si" && invoiceData && (
            <Text style={s.invoiceData}>
              RUC: {invoiceData.ruc} · {invoiceData.razonSocial}
            </Text>
          )}
        </View>

        {/* ── Medio de pago ─────────────────────────────────────────────────── */}
        <View style={[s.card, { marginBottom: Spacing.xl }]}>
          <Text style={s.paymentTitle}>Medio de pago</Text>

          {/* Selector tarjeta / yape */}
          <View style={s.paymentOptions}>
            <TouchableOpacity
              style={[
                s.payCard,
                paymentMethod === "card" ? s.payCardSel : s.payCardUnsel,
              ]}
              onPress={() =>
                setPaymentMethod(paymentMethod === "card" ? null : "card")
              }
            >
              <Icon
                name="wallet"
                size={18}
                color={
                  paymentMethod === "card"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  s.payCardLabel,
                  paymentMethod === "card" && { color: colors.primary },
                ]}
              >
                Tarjeta{"\n"}Débito / Crédito
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.yapeCard,
                paymentMethod === "yape" ? s.yapeCardSel : s.yapeCardUnsel,
              ]}
              onPress={() =>
                setPaymentMethod(paymentMethod === "yape" ? null : "yape")
              }
            >
              <Text style={s.yapeText}>yape</Text>
            </TouchableOpacity>
          </View>

          {/* ── Tarjetas guardadas ──────────────────────────────────────────── */}
          {paymentMethod === "card" && (
            <View style={s.form}>
              {SAVED_CARDS.length > 0 ? (
                <>
                  <Text style={s.savedCardsLabel}>Mis tarjetas</Text>
                  {SAVED_CARDS.map((card) => {
                    const isSelected = selectedCardId === card.id;
                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[
                          s.savedCardRow,
                          isSelected && {
                            borderColor: colors.primary,
                            borderWidth: 2,
                          },
                          !isSelected && {
                            borderColor: colors.border + "40",
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() => setSelectedCardId(card.id)}
                        activeOpacity={0.7}
                      >
                        {/* Indicador de marca */}
                        <View
                          style={[
                            s.cardBrandBadge,
                            { backgroundColor: getBrandColor(card.brand) },
                          ]}
                        >
                          <Text style={s.cardBrandText}>
                            {card.brand === "mastercard"
                              ? "MC"
                              : getBrandLabel(card.brand).slice(0, 2)}
                          </Text>
                        </View>

                        {/* Info */}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[s.cardRowNumber, { color: colors.text }]}
                          >
                            {getBrandLabel(card.brand)} •••• {card.last4}
                          </Text>
                          <Text style={s.cardRowExpiry}>
                            Vence {card.expiryMonth}/{card.expiryYear}
                            {card.isDefault ? "  ·  Predeterminada" : ""}
                          </Text>
                        </View>

                        {/* Radio */}
                        <View
                          style={[
                            s.radioOuter,
                            {
                              borderColor: isSelected
                                ? colors.primary
                                : colors.border,
                            },
                          ]}
                        >
                          {isSelected && <View style={s.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Agregar nueva tarjeta */}
                  <TouchableOpacity
                    style={s.addNewCardRow}
                    onPress={() => router.push("/(screens)/add-card")}
                    activeOpacity={0.7}
                  >
                    <View style={s.addNewCardIcon}>
                      <Icon name="plus" size={16} color={colors.primary} />
                    </View>
                    <Text style={[s.rememberLabel, { color: colors.primary }]}>
                      Agregar nueva tarjeta
                    </Text>
                    <Icon name="arrow-right" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </>
              ) : (
                /* Sin tarjetas guardadas */
                <TouchableOpacity
                  style={s.addNewCardRow}
                  onPress={() => router.push("/(screens)/add-card")}
                  activeOpacity={0.7}
                >
                  <View style={s.addNewCardIcon}>
                    <Icon name="plus" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.rememberLabel, { color: colors.primary }]}>
                      Agregar tarjeta
                    </Text>
                    <Text style={s.cardRowExpiry}>Débito o crédito</Text>
                  </View>
                  <Icon name="arrow-right" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Formulario Yape ─────────────────────────────────────────────── */}
          {paymentMethod === "yape" && (
            <View style={s.form}>
              <Text style={s.yapeAmountLabel}>
                Monto: {currency} {subtotal.toFixed(2)}
              </Text>
              <Text style={s.yapeDesc}>
                Pagar con Yape{"\n"}Obtén el código de aprobación en la app de
                Yape para terminar tu compra.
              </Text>

              <Controller
                control={yapeControl}
                name="yapePhone"
                rules={{
                  required: "Requerido",
                  minLength: {
                    value: 9,
                    message: "Ingresa un número válido",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Ingresa tu celular Yape"
                    placeholderTextColor={colors.text}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    type="phone"
                    maxLength={9}
                    error={yapeErrors.yapePhone?.message}
                    containerStyle={{ marginBottom: Spacing.xs }}
                  />
                )}
              />

              <Controller
                control={yapeControl}
                name="yapeCode"
                rules={{ required: "Requerido", minLength: 4 }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Pega tu código de aprobación"
                    placeholderTextColor={colors.text}
                    value={value}
                    maxLength={4}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={yapeErrors.yapeCode?.message}
                    containerStyle={{ marginBottom: Spacing.xs }}
                  />
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Botones fijos ──────────────────────────────────────────────────── */}
      <View style={s.fixedBottom}>
        {/* <TouchableOpacity
          style={s.addReservaBtn}
          onPress={() => router.push("/(tabs)/(user)/select-pet")}
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <Text style={s.addReservaText}>Añadir reserva</Text>
        </TouchableOpacity> */}
        <Button
          title={`Pagar ${currency} ${subtotal.toFixed(2)}`}
          onPress={handlePay}
          fullWidth
          loading={paying}
          disabled={!paymentMethod}
          style={{ borderRadius: BorderRadius.full }}
        />
      </View>

      <CouponModal
        visible={couponVisible}
        onClose={() => setCouponVisible(false)}
        onApply={(code: string) => {
          setCouponVisible(false);
          applyCoupon(code, COUPON_DISCOUNT);
        }}
        colors={colors}
      />
      <SuccessModal
        visible={successVisible}
        onGoHome={handleGoHome}
        colors={colors}
      />
    </SafeAreaView>
  );
}
