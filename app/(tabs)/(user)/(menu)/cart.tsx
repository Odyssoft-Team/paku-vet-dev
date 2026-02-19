import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

  const {
    serviceName,
    servicePrice,
    extraLabel,
    extraPrice,
    addressId,
    appliedCoupon,
    couponDiscount,
    needsInvoice,
    invoiceData,
    applyCoupon,
    removeCoupon,
    removeInvoice,
    clearBooking,
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
    return (servicePrice ?? 0) + (extraPrice ?? 0) - couponDiscount;
  }, [servicePrice, extraPrice, couponDiscount]);

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
    await new Promise((r) => setTimeout(r, 1200));
    setPaying(false);
    setSuccessVisible(true);
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
      justifyContent: "space-between",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    backBtn: { padding: Spacing.sm, width: 40 },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFF",
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
    addReservaText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.push("/(tabs)/(user)/select-date")}
        >
          <Icon name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tu carrito</Text>
        <View style={s.backBtn} />
      </View>

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

          {serviceName && servicePrice != null && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>• PAKU Spa - {serviceName}</Text>
              <Text style={s.summaryValue}>S/{servicePrice}.00</Text>
            </View>
          )}

          {extraLabel && extraPrice != null && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>• {extraLabel}</Text>
              <Text style={s.summaryValue}>S/{extraPrice}.00</Text>
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
              <Icon name="wallet" size={18} color={colors.textSecondary} />
              <Text style={s.payCardLabel}>
                Agregar tarjeta{"\n"}Débito o crédito
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

          {/* ── Formulario Tarjeta ──────────────────────────────────────────── */}
          {paymentMethod === "card" && (
            <View style={s.form}>
              {/* Número */}
              <Controller
                control={cardControl}
                name="cardNumber"
                rules={{
                  required: "Requerido",
                  minLength: { value: 16, message: "Número inválido" },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Número de tarjeta"
                    placeholder="Añadir número"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    maxLength={19}
                    leftIcon="wallet"
                    error={cardErrors.cardNumber?.message}
                    containerStyle={{ marginBottom: Spacing.xs }}
                  />
                )}
              />

              {/* Válida hasta + CVV */}
              <View style={s.formRow}>
                <View style={s.halfField}>
                  <Controller
                    control={cardControl}
                    name="cardExpiry"
                    rules={{
                      required: "Requerido",
                      pattern: {
                        value: /^\d{2}\/\d{2}$/,
                        message: "Formato: 00/00",
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Válida hasta"
                        placeholder="00/00"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        maxLength={5}
                        error={cardErrors.cardExpiry?.message}
                        containerStyle={{ marginBottom: Spacing.xs }}
                      />
                    )}
                  />
                </View>
                <View style={s.halfField}>
                  <Controller
                    control={cardControl}
                    name="cardCvv"
                    rules={{
                      required: "Requerido",
                      minLength: { value: 3, message: "Mín. 3 dígitos" },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="CVV"
                        placeholder="•••"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        maxLength={4}
                        type="password"
                        error={cardErrors.cardCvv?.message}
                        containerStyle={{ marginBottom: Spacing.xs }}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Nombre + Apellido */}
              <View style={s.formRow}>
                <View style={s.halfField}>
                  <Controller
                    control={cardControl}
                    name="cardName"
                    rules={{ required: "Requerido" }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Nombre"
                        placeholder=""
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={cardErrors.cardName?.message}
                        containerStyle={{ marginBottom: Spacing.xs }}
                      />
                    )}
                  />
                </View>
                <View style={s.halfField}>
                  <Controller
                    control={cardControl}
                    name="cardLastName"
                    rules={{ required: "Requerido" }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Apellido"
                        placeholder=""
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={cardErrors.cardLastName?.message}
                        containerStyle={{ marginBottom: Spacing.xs }}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Correo */}
              <Controller
                control={cardControl}
                name="cardEmail"
                rules={{
                  required: "Requerido",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Correo inválido",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Correo"
                    placeholder="Correo"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    type="email"
                    error={cardErrors.cardEmail?.message}
                    containerStyle={{ marginBottom: Spacing.xs }}
                  />
                )}
              />

              {/* Recordar tarjeta */}
              <TouchableOpacity
                style={s.rememberRow}
                onPress={() => setSaveCard(!saveCard)}
              >
                <View
                  style={[
                    s.checkbox,
                    {
                      borderColor: saveCard ? colors.primary : colors.border,
                      backgroundColor: saveCard
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {saveCard && <Icon name="check" size={12} color="#FFF" />}
                </View>
                <Text style={s.rememberLabel}>Recordar tarjeta</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Formulario Yape ─────────────────────────────────────────────── */}
          {paymentMethod === "yape" && (
            <View style={s.form}>
              <Text style={s.yapeAmountLabel}>
                Monto: S/{subtotal.toFixed(2)}
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
                rules={{ required: "Requerido" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Pega tu código de aprobación"
                    placeholderTextColor={colors.text}
                    value={value}
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
        <TouchableOpacity
          style={s.addReservaBtn}
          onPress={() => router.push("/(tabs)/(user)/select-pet")}
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <Text style={s.addReservaText}>Añadir reserva</Text>
        </TouchableOpacity>
        <Button
          title={`Pagar S/${subtotal.toFixed(2)}`}
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
