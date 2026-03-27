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
import { useStoreProduct } from "@/hooks/useStoreProduct";

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Coupon Modal ─────────────────────────────────────────────────────────────

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
              <Text
                style={{
                  fontFamily: Typography.fontFamily.bold,
                  fontSize: Typography.fontSize.md,
                  color: colors.primary,
                  marginBottom: Spacing.md,
                }}
              >
                🎟 Agregar cupón
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: BorderRadius.lg,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 12,
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.regular,
                  color: colors.text,
                  backgroundColor: colors.background,
                  marginBottom: Spacing.md,
                }}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                autoFocus
                placeholder="Ej: PAKU20"
                placeholderTextColor={colors.textSecondary}
              />
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
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#E8F5E9",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: Spacing.md,
          }}
        >
          <Text style={{ fontSize: 32 }}>✓</Text>
        </View>
        <Text
          style={{
            fontFamily: Typography.fontFamily.bold,
            fontSize: Typography.fontSize.lg,
            color: colors.primary,
            textAlign: "center",
            marginBottom: Spacing.xs,
          }}
        >
          ¡Pago exitoso!
        </Text>
        <Text
          style={{
            fontFamily: Typography.fontFamily.regular,
            fontSize: Typography.fontSize.sm,
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: Spacing.lg,
          }}
        >
          Tu reserva fue confirmada correctamente.
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

  // Cargar detalles del producto para mostrar nombre y precio de cada addon
  const { data: productDetail } = useStoreProduct(
    productId ?? "",
    petId ?? undefined,
  );
  const selectedAddons = useMemo(
    () =>
      (productDetail?.available_addons ?? []).filter((a) =>
        selectedAddonIds.includes(a.id),
      ),
    [productDetail, selectedAddonIds],
  );

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

  const {
    control: yapeControl,
    handleSubmit: handleYapeSubmit,
    formState: { errors: yapeErrors },
  } = useForm<YapeFormValues>({
    defaultValues: { yapePhone: "", yapeCode: "" },
  });

  const subtotal = useMemo(
    () => (quotedTotal ?? 0) - couponDiscount,
    [quotedTotal, couponDiscount],
  );

  const handleInvoiceToggle = (option: "si" | "no") => {
    setInvoiceOption(option);
    if (option === "si") router.push("/(tabs)/(user)/invoice-form");
    else removeInvoice();
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
            addon_ids: selectedAddonIds,
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
        error.response?.data?.detail || "Ocurrió un error al procesar tu pago.";
      Alert.alert("Error al procesar", message);
    } finally {
      setPaying(false);
    }
  };

  const handlePay = () => {
    if (!paymentMethod) return;
    if (paymentMethod === "yape") handleYapeSubmit(() => processPayment())();
    else processPayment();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader title="Tu carrito" right={{ type: "none" }} hideBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Dirección ─────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.addressBar, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/(tabs)/(user)/select-address")}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.addressIcon,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Icon name="gps" size={16} color={colors.primary} />
          </View>
          <Text
            style={[styles.addressText, { color: colors.text }]}
            numberOfLines={1}
          >
            {addressLabel}
          </Text>
          <Icon name="arrow-right" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* ── Resumen del pedido ────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionTitleRow}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginBottom: 0 },
              ]}
            >
              Resumen del pedido
            </Text>
            <TouchableOpacity
              style={[
                styles.editBtn,
                {
                  borderColor: colors.primary + "40",
                  backgroundColor: colors.primary + "08",
                },
              ]}
              onPress={() => router.push("/(tabs)/(user)/additional-service")}
              activeOpacity={0.7}
            >
              <Icon name="pencil" size={12} color={colors.primary} />
              <Text style={[styles.editBtnText, { color: colors.primary }]}>
                Editar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Servicio base */}
          {productName && (
            <View style={styles.lineRow}>
              <Text
                style={[styles.lineLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                PAKU Spa — {productName}
              </Text>
              <Text style={[styles.lineValue, { color: colors.text }]}>
                {productDetail?.price != null
                  ? `${currency} ${productDetail.price.toFixed(2)}`
                  : quotedTotal != null
                    ? `${currency} ${quotedTotal.toFixed(2)}`
                    : "—"}
              </Text>
            </View>
          )}

          {/* Addons con nombre y precio individual */}
          {selectedAddons.length > 0 ? (
            selectedAddons.map((addon) => (
              <View key={addon.id} style={styles.lineRow}>
                <View style={styles.addonLabelRow}>
                  <View
                    style={[
                      styles.addonDot,
                      { backgroundColor: colors.primary + "60" },
                    ]}
                  />
                  <Text
                    style={[styles.addonLabel, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {addon.name}
                  </Text>
                </View>
                <Text
                  style={[styles.lineValue, { color: colors.textSecondary }]}
                >
                  {addon.price != null && addon.price > 0
                    ? `${addon.currency} ${addon.price.toFixed(2)}`
                    : "Incluido"}
                </Text>
              </View>
            ))
          ) : selectedAddonIds.length > 0 ? (
            // Fallback si aún no cargaron los detalles
            <View style={styles.lineRow}>
              <Text
                style={[styles.addonLabel, { color: colors.textSecondary }]}
              >
                {selectedAddonIds.length} adicional
                {selectedAddonIds.length > 1 ? "es" : ""}
              </Text>
              <Text style={[styles.lineValue, { color: colors.textSecondary }]}>
                Incluido
              </Text>
            </View>
          ) : null}

          {/* Cupón */}
          {appliedCoupon ? (
            <View style={styles.lineRow}>
              <View style={styles.addonLabelRow}>
                <View
                  style={[styles.couponBadge, { backgroundColor: "#E8F5E9" }]}
                >
                  <Text style={[styles.couponBadgeText, { color: "#2E7D32" }]}>
                    🎟 {appliedCoupon}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={removeCoupon}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.removeText, { color: colors.error }]}>
                    Quitar
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.lineValue, { color: "#2E7D32" }]}>
                -{currency} {COUPON_DISCOUNT.toFixed(2)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.couponRow}
              onPress={() => setCouponVisible(true)}
            >
              <Icon name="ticket" size={13} color={colors.textSecondary} />
              <Text
                style={[styles.couponText, { color: colors.textSecondary }]}
              >
                ¿Tienes un cupón?
              </Text>
              <Text style={[styles.couponLink, { color: colors.primary }]}>
                Agregar
              </Text>
            </TouchableOpacity>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {currency} {subtotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ── Factura ───────────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.invoiceRow}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginBottom: 0 },
              ]}
            >
              ¿Necesitas factura?
            </Text>
            <View style={styles.radioGroup}>
              {(["si", "no"] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.radioOption}
                  onPress={() => handleInvoiceToggle(opt)}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor:
                          invoiceOption === opt
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    {invoiceOption === opt && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: colors.text }]}>
                    {opt === "si" ? "Sí" : "No"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {invoiceOption === "si" && invoiceData && (
            <Text style={[styles.invoiceData, { color: colors.textSecondary }]}>
              RUC: {invoiceData.ruc} · {invoiceData.razonSocial}
            </Text>
          )}
        </View>

        {/* ── Medio de pago ─────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Medio de pago
          </Text>

          {/* Opciones — ahora ambas sin color de fondo cuando no están seleccionadas */}
          <View style={styles.paymentOptions}>
            {/* Tarjeta */}
            <TouchableOpacity
              style={[
                styles.payOption,
                {
                  borderColor:
                    paymentMethod === "card" ? colors.primary : colors.border,
                  backgroundColor:
                    paymentMethod === "card"
                      ? colors.primary + "08"
                      : colors.background,
                },
              ]}
              onPress={() =>
                setPaymentMethod(paymentMethod === "card" ? null : "card")
              }
              activeOpacity={0.8}
            >
              <Icon
                name="wallet"
                size={22}
                color={
                  paymentMethod === "card"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.payOptionLabel,
                  {
                    color:
                      paymentMethod === "card"
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                Tarjeta{"\n"}Débito / Crédito
              </Text>
              {paymentMethod === "card" && (
                <View
                  style={[
                    styles.payCheckDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>

            {/* Yape — sin color morado cuando no está seleccionado */}
            <TouchableOpacity
              style={[
                styles.payOption,
                paymentMethod === "yape"
                  ? { borderColor: "#6B21A8", backgroundColor: "#6B21A8" }
                  : {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
              ]}
              onPress={() =>
                setPaymentMethod(paymentMethod === "yape" ? null : "yape")
              }
              activeOpacity={0.8}
            >
              {paymentMethod === "yape" ? (
                <>
                  <Text style={styles.yapeTextActive}>yape</Text>
                  <View
                    style={[styles.payCheckDot, { backgroundColor: "#FFF" }]}
                  />
                </>
              ) : (
                <>
                  <Text
                    style={[
                      styles.yapeTextInactive,
                      { color: colors.textSecondary },
                    ]}
                  >
                    yape
                  </Text>
                  <Text
                    style={[
                      styles.payOptionLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Pagar con Yape
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Tarjetas guardadas ─────────────────────────────────────────── */}
          {paymentMethod === "card" && (
            <View style={styles.cardSection}>
              <Text
                style={[
                  styles.savedCardsLabel,
                  { color: colors.textSecondary },
                ]}
              >
                MIS TARJETAS
              </Text>
              {SAVED_CARDS.map((card) => {
                const isSel = selectedCardId === card.id;
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.savedCardRow,
                      { backgroundColor: colors.background },
                      isSel
                        ? { borderColor: colors.primary, borderWidth: 2 }
                        : { borderColor: colors.border, borderWidth: 1 },
                    ]}
                    onPress={() => setSelectedCardId(card.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.brandBadge,
                        { backgroundColor: getBrandColor(card.brand) },
                      ]}
                    >
                      <Text style={styles.brandText}>
                        {card.brand === "mastercard"
                          ? "MC"
                          : getBrandLabel(card.brand).slice(0, 2)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardNumber, { color: colors.text }]}>
                        {getBrandLabel(card.brand)} •••• {card.last4}
                      </Text>
                      <Text
                        style={[
                          styles.cardExpiry,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Vence {card.expiryMonth}/{card.expiryYear}
                        {card.isDefault ? "  ·  Predeterminada" : ""}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: isSel ? colors.primary : colors.border },
                      ]}
                    >
                      {isSel && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.addCardRow,
                  {
                    backgroundColor: colors.primary + "0D",
                    borderColor: colors.primary + "40",
                  },
                ]}
                onPress={() => router.push("/(screens)/add-card")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.addCardIcon,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Icon name="plus" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.addCardText, { color: colors.primary }]}>
                  Agregar nueva tarjeta
                </Text>
                <Icon name="arrow-right" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Formulario Yape ────────────────────────────────────────────── */}
          {paymentMethod === "yape" && (
            <View style={styles.cardSection}>
              <View
                style={[styles.yapeInfoBox, { backgroundColor: "#F3E8FF" }]}
              >
                <Text style={[styles.yapeInfoTitle, { color: "#6B21A8" }]}>
                  {currency} {subtotal.toFixed(2)}
                </Text>
                <Text style={[styles.yapeInfoDesc, { color: "#7C3AED" }]}>
                  Obtén el código de aprobación en tu app Yape para completar el
                  pago.
                </Text>
              </View>

              <Controller
                control={yapeControl}
                name="yapePhone"
                rules={{
                  required: "Requerido",
                  minLength: { value: 9, message: "Número inválido" },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Número de celular Yape"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    type="phone"
                    maxLength={9}
                    error={yapeErrors.yapePhone?.message}
                    containerStyle={{ marginBottom: Spacing.sm }}
                  />
                )}
              />

              <Controller
                control={yapeControl}
                name="yapeCode"
                rules={{ required: "Requerido", minLength: 4 }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Código de aprobación (4 dígitos)"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    maxLength={4}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={yapeErrors.yapeCode?.message}
                    containerStyle={{ marginBottom: Spacing.sm }}
                  />
                )}
              />
            </View>
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Footer fijo ───────────────────────────────────────────────────── */}
      <View
        style={[
          styles.fixedFooter,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        {!paymentMethod && (
          <Text style={[styles.selectPayHint, { color: colors.textSecondary }]}>
            Selecciona un medio de pago para continuar
          </Text>
        )}
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
        onGoHome={() => {
          setSuccessVisible(false);
          clearBooking();
          router.replace("/(tabs)/(user)/");
        }}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },

  // Dirección
  addressBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },

  // Cards
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
  },

  // Resumen compacto
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  lineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  lineLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  lineValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    flexShrink: 0,
  },
  addonLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
    paddingRight: Spacing.sm,
  },
  addonDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
  },
  addonLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },

  // Resumen (mantener para compatibilidad)
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Cupón
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  couponText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  couponLink: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    marginLeft: "auto",
  },
  couponAppliedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  couponBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  couponBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  removeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  divider: { height: 1, marginVertical: Spacing.sm - 2 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },

  // Factura
  invoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  radioLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  invoiceData: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.sm,
  },

  // Medios de pago
  paymentOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  payOption: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    gap: 4,
    position: "relative",
  },
  payOptionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: "center",
    lineHeight: 16,
  },
  payCheckDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  yapeTextActive: {
    color: "#FFF",
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontStyle: "italic",
  },
  yapeTextInactive: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    fontStyle: "italic",
  },

  // Tarjetas guardadas
  cardSection: { marginTop: Spacing.sm },
  savedCardsLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
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
  },
  brandBadge: {
    width: 40,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: "#FFF",
  },
  cardNumber: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 0.3,
  },
  cardExpiry: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  addCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Yape form
  yapeInfoBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  yapeInfoTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 4,
  },
  yapeInfoDesc: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },

  // Footer
  fixedFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  selectPayHint: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
});
