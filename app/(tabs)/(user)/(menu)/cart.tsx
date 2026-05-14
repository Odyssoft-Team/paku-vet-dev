/**
 * cart.tsx
 *
 * Pantalla de carrito / checkout — integración Culqi.
 *
 * Flujo de pago con tarjeta guardada:
 * 1. Cargamos las tarjetas guardadas del backend (GET /api/culqi/cards).
 * 2. El usuario selecciona una tarjeta guardada.
 * 3. Para confirmar el pago se muestra un modal nativo que pide el CVV.
 * 4. Con el CVV se llama a POST /api/culqi/charges con:
 *    - source_id = culqiCardId (crd_test_xxx) de la tarjeta guardada
 *    - El CVV NO se re-tokeniza para tarjetas guardadas en Culqi —
 *      el cargo se hace directamente con el card id.
 * 5. Mostramos el resultado al usuario.
 *
 * NOTA: A diferencia de Mercado Pago, Culqi NO requiere re-tokenizar el CVV
 * al cobrar con una tarjeta guardada. El cargo se hace directo con el card id.
 * El modal de CVV sirve como confirmación UX, pero no se tokeniza.
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useOrderStore } from "@/store/orderStore";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useBookingStore } from "@/store/bookingStore";
import { useAddressStore } from "@/store/addressStore";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { CreateCartItemInput } from "@/types/cart.types";
import { SavedPaymentMethod } from "@/types/payment.types";
import { cartService } from "@/api/services/cart.service";
import { orderService } from "@/api/services/order.service";
import {
  paymentService,
  getPaymentErrorMessage,
} from "@/api/services/payment.service";
import { useStoreProduct } from "@/hooks/useStoreProduct";
import { useSavedCards } from "@/hooks/useSavedCards";
import { useAuthStore } from "@/store/authStore";
import { CONFIG } from "@/constants/config";

const COUPON_DISCOUNT = 20;

// ─── Helpers de tarjeta ────────────────────────────────────────────────────────

function getBrandColor(brand: string): string {
  const b = brand.toLowerCase();
  if (b.includes("visa")) return "#1D2AD8";
  if (b.includes("master")) return "#EB001B";
  if (b.includes("amex")) return "#007B5E";
  return "#6B7280";
}

function getBrandLabel(brand: string): string {
  const b = brand.toLowerCase();
  if (b.includes("visa")) return "VISA";
  if (b.includes("master")) return "MC";
  if (b.includes("amex")) return "AMEX";
  return brand.toUpperCase().slice(0, 4);
}

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

// ─── Culqi WebView Modal ───────────────────────────────────────────────────────
//
// Monta el Checkout oficial de Culqi dentro de una WebView.
// El SDK genera el formulario (tarjeta + Yape si está habilitado en el panel).
// Cuando el usuario completa el pago, Culqi llama a window.culqi() con el token,
// y lo comunicamos al código nativo vía postMessage.

const CULQI_HTML = (
  publicKey: string,
  amount: number,
  currency: string,
  email: string,
  description: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://checkout.culqi.com/js/v4"></script>
  <style>
    body { margin: 0; padding: 0; background: transparent; }
  </style>
</head>
<body>
<script>
  var culqi = new Culqi({
    publicKey: '${publicKey}',
    style: {
      logo: '',
      maincolor: '#7C3AED',
      buttontext: '#ffffff',
      maintext: '#1a1a2e',
      desctext: '#666'
    }
  });

  culqi.settings({
    title: 'Paku',
    currency: '${currency}',
    amount: ${amount},
    order: '',
    description: '${description.replace(/'/g, "\\'")}',
  });

  // Abre el modal de Culqi automáticamente al cargar
  window.onload = function() {
    culqi.open();
  };

  // Culqi llama a esta función cuando el usuario completa el formulario
  function culqi() {
    if (culqi.token) {
      // Éxito — enviamos el token al código nativo
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CULQI_TOKEN',
        token: culqi.token.id,
        email: culqi.token.email,
      }));
    } else if (culqi.order) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CULQI_ORDER',
        order: culqi.order,
      }));
    }
  }

  // Detectar cierre del modal de Culqi
  document.addEventListener('culqi_close', function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CULQI_CLOSED' }));
  });
</script>
</body>
</html>
`;

interface CulqiWebViewModalProps {
  visible: boolean;
  amount: number; // en céntimos
  currency: string;
  email: string;
  description: string;
  onToken: (token: string) => void;
  onClose: () => void;
  colors: any;
}

const CulqiWebViewModal: React.FC<CulqiWebViewModalProps> = ({
  visible,
  amount,
  currency,
  email,
  description,
  onToken,
  onClose,
  colors,
}) => {
  const publicKey = CONFIG.CULQI_PUBLIC_KEY;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("[CulqiWebView] mensaje recibido:", data.type);
      if (data.type === "CULQI_TOKEN" && data.token) {
        onToken(data.token);
      } else if (data.type === "CULQI_CLOSED") {
        onClose();
      }
    } catch (e) {
      console.error("[CulqiWebView] Error parseando mensaje:", e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
        {/* Header con botón cerrar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingTop: 50,
            paddingHorizontal: Spacing.md,
            paddingBottom: Spacing.sm,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 20,
              padding: 8,
            }}
          >
            <Icon name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* WebView con el checkout de Culqi */}
        <View
          style={{
            flex: 1,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
            backgroundColor: colors.surface,
          }}
        >
          <WebView
            source={{
              html: CULQI_HTML(publicKey, amount, currency, email, description),
            }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.surface,
                }}
              >
                <ActivityIndicator color={colors.primary} size="large" />
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: Spacing.sm,
                    fontFamily: Typography.fontFamily.regular,
                  }}
                >
                  Cargando pasarela de pago...
                </Text>
              </View>
            )}
            style={{ flex: 1, backgroundColor: "transparent" }}
          />
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

type PaymentMethod = "card" | "culqi" | "simulated" | null;

export default function CartScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setOrder } = useOrderStore();
  const user = useAuthStore((s) => s.user);

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

  // Tarjetas guardadas desde el backend (Culqi)
  const { cards, loading: cardsLoading, fetchCards } = useSavedCards();

  // UI state
  const [couponVisible, setCouponVisible] = useState(false);
  const [invoiceOption, setInvoiceOption] = useState<"si" | "no">(
    needsInvoice ? "si" : "no",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [paying, setPaying] = useState(false);
  const [culqiModalVisible, setCulqiModalVisible] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const subtotal = useMemo(
    () => (quotedTotal ?? 0) - couponDiscount,
    [quotedTotal, couponDiscount],
  );

  // Cargar tarjetas al seleccionar el método de pago
  useEffect(() => {
    if (paymentMethod === "card" && cards.length === 0) {
      fetchCards();
    }
  }, [paymentMethod]);

  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  const handleInvoiceToggle = (option: "si" | "no") => {
    setInvoiceOption(option);
    if (option === "si") router.push("/(tabs)/(user)/invoice-form");
    else removeInvoice();
  };

  // ─── Helpers de carrito ────────────────────────────────────────────────────

  const buildCartItems = (): CreateCartItemInput[] => [
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

  // ─── Pago simulado ─────────────────────────────────────────────────────────
  const handleSimulatedPay = async () => {
    setPaying(true);
    try {
      const cartResponse = await cartService.createWithItems({
        items: buildCartItems(),
      });
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
        error.response?.data?.detail || "Ocurrió un error al procesar el pago.";
      Alert.alert("Error", message);
    } finally {
      setPaying(false);
    }
  };

  // ─── Pago con tarjeta guardada (sin CVV) ───────────────────────────────────
  // Flujo: crear carrito → checkout → crear orden → charge → confirm-payment
  const handleSavedCardPay = async () => {
    if (!selectedCardId || !selectedCard) return;
    const email = user?.email;
    if (!email) {
      Alert.alert("Error", "No se encontró el email del usuario.");
      return;
    }

    setPaying(true);
    let orderId: string | null = null;

    try {
      // 1. Carrito + orden
      console.log("[Cart] Creando carrito...");
      const cartResponse = await cartService.createWithItems({
        items: buildCartItems(),
      });
      const newCartId = cartResponse.cart.id;
      setCartId(newCartId);
      await cartService.checkout(newCartId);
      const newOrder = await orderService.createOrder({
        cart_id: newCartId,
        address_id: addressId!,
      });
      orderId = newOrder.id;
      console.log("[Cart] Orden creada:", orderId);

      // 2. Cobrar con tarjeta guardada (source_id = crd_test_xxx)
      console.log("[Cart] Cobrando con tarjeta guardada:", selectedCard.id);
      const charge = await paymentService.charge({
        amount: Math.round(subtotal * 100),
        currency_code: (currency as "PEN" | "USD") || "PEN",
        email,
        source_id: selectedCard.id,
        description: `Paku — ${productName ?? "Servicio"}`,
      });
      console.log("[Cart] Cargo exitoso:", charge.id);

      // 3. Confirmar pago en paku-backend
      await orderService.confirmPayment(orderId, charge.id);
      console.log("[Cart] Pago confirmado en orden:", orderId);

      setOrder(newOrder);
      setSuccessVisible(true);
    } catch (error: any) {
      console.error("[Cart] Error en pago:", error?.message);
      // Si el cargo falló y ya tenemos orden, marcarla como fallida
      if (orderId) {
        try {
          await orderService.failPayment(orderId);
        } catch {}
      }
      const msg = getPaymentErrorMessage(error);
      Alert.alert("Error al procesar", msg);
    } finally {
      setPaying(false);
    }
  };

  // ─── Pago con Culqi Checkout (modal WebView — tarjeta nueva / Yape) ─────────
  // Paso 1: crear carrito + orden, luego abrir el modal de Culqi
  const handleCulqiModalOpen = async () => {
    const email = user?.email;
    if (!email) {
      Alert.alert("Error", "No se encontró el email del usuario.");
      return;
    }

    setPaying(true);
    try {
      console.log("[Cart] Preparando orden para Culqi modal...");
      const cartResponse = await cartService.createWithItems({
        items: buildCartItems(),
      });
      const newCartId = cartResponse.cart.id;
      setCartId(newCartId);
      await cartService.checkout(newCartId);
      const newOrder = await orderService.createOrder({
        cart_id: newCartId,
        address_id: addressId!,
      });
      setPendingOrderId(newOrder.id);
      setOrder(newOrder);
      console.log(
        "[Cart] Orden lista, abriendo Culqi modal. orderId:",
        newOrder.id,
      );
      setCulqiModalVisible(true);
    } catch (error: any) {
      console.error("[Cart] Error preparando orden:", error?.message);
      Alert.alert("Error", error?.message || "No se pudo preparar la orden.");
    } finally {
      setPaying(false);
    }
  };

  // Paso 2: Culqi devolvió un token — cobrar y confirmar
  const handleCulqiToken = async (token: string) => {
    setCulqiModalVisible(false);
    const email = user?.email;
    if (!email || !pendingOrderId) return;

    setPaying(true);
    try {
      console.log(
        "[Cart] Token Culqi recibido:",
        token,
        "orden:",
        pendingOrderId,
      );

      // Cobrar con el token generado por el modal
      const charge = await paymentService.charge({
        amount: Math.round(subtotal * 100),
        currency_code: (currency as "PEN" | "USD") || "PEN",
        email,
        source_id: token,
        description: `Paku — ${productName ?? "Servicio"}`,
      });
      console.log("[Cart] Cargo exitoso:", charge.id);

      // Confirmar pago en paku-backend
      await orderService.confirmPayment(pendingOrderId, charge.id);
      console.log("[Cart] Pago confirmado en orden:", pendingOrderId);

      setPendingOrderId(null);
      setSuccessVisible(true);
    } catch (error: any) {
      console.error("[Cart] Error procesando token Culqi:", error?.message);
      if (pendingOrderId) {
        try {
          await orderService.failPayment(pendingOrderId);
        } catch {}
      }
      const msg = getPaymentErrorMessage(error);
      Alert.alert("Error al procesar", msg);
    } finally {
      setPaying(false);
    }
  };

  // ─── Dispatcher principal ──────────────────────────────────────────────────
  const handlePay = () => {
    if (paymentMethod === "simulated") return handleSimulatedPay();
    if (paymentMethod === "card") return handleSavedCardPay();
    if (paymentMethod === "culqi") return handleCulqiModalOpen();
    Alert.alert("Selecciona un medio de pago", "Elige cómo quieres pagar.");
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
        {/* ── Dirección ─────────────────────────────────────────────────── */}
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

        {/* ── Resumen del pedido ──────────────────────────────────────── */}
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

        {/* ── Factura ───────────────────────────────────────────────── */}
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

        {/* ── Medio de pago ─────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Medio de pago
          </Text>

          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <TouchableOpacity
              style={[
                styles.payOption,
                {
                  flex: 1,
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
                Tarjeta{"\n"}Guardada
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

            {/* Culqi Checkout — tarjeta nueva o Yape */}
            <TouchableOpacity
              style={[
                styles.payOption,
                {
                  flex: 1,
                  borderColor:
                    paymentMethod === "culqi" ? colors.primary : colors.border,
                  backgroundColor:
                    paymentMethod === "culqi"
                      ? colors.primary + "08"
                      : colors.background,
                },
              ]}
              onPress={() =>
                setPaymentMethod(paymentMethod === "culqi" ? null : "culqi")
              }
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20 }}>💳</Text>
              <Text
                style={[
                  styles.payOptionLabel,
                  {
                    color:
                      paymentMethod === "culqi"
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                Tarjeta / Yape
              </Text>
              {paymentMethod === "culqi" && (
                <View
                  style={[
                    styles.payCheckDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>

            {/* TODO: eliminar cuando Culqi esté completamente estable */}
            <TouchableOpacity
              style={[
                styles.payOption,
                {
                  flex: 1,
                  borderColor:
                    paymentMethod === "simulated" ? "#F59E0B" : colors.border,
                  backgroundColor:
                    paymentMethod === "simulated"
                      ? "#FEF3C7"
                      : colors.background,
                  borderStyle: "dashed",
                },
              ]}
              onPress={() =>
                setPaymentMethod(
                  paymentMethod === "simulated" ? null : "simulated",
                )
              }
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20 }}>🧪</Text>
              <Text
                style={[
                  styles.payOptionLabel,
                  {
                    color:
                      paymentMethod === "simulated"
                        ? "#92400E"
                        : colors.textSecondary,
                  },
                ]}
              >
                Simulado
              </Text>
              {paymentMethod === "simulated" && (
                <View
                  style={[styles.payCheckDot, { backgroundColor: "#F59E0B" }]}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Lista de tarjetas guardadas */}
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

              {cardsLoading ? (
                <View
                  style={{ alignItems: "center", paddingVertical: Spacing.md }}
                >
                  <ActivityIndicator color={colors.primary} />
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: Typography.fontSize.xs,
                      marginTop: 6,
                      fontFamily: Typography.fontFamily.regular,
                    }}
                  >
                    Cargando tarjetas...
                  </Text>
                </View>
              ) : cards.length === 0 ? (
                <View
                  style={{ alignItems: "center", paddingVertical: Spacing.md }}
                >
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: Typography.fontSize.sm,
                      fontFamily: Typography.fontFamily.regular,
                      textAlign: "center",
                    }}
                  >
                    No tienes tarjetas guardadas.{"\n"}Agrega una para
                    continuar.
                  </Text>
                </View>
              ) : (
                cards.map((card) => {
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
                          {getBrandLabel(card.brand)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.cardNumber, { color: colors.text }]}
                        >
                          {getBrandLabel(card.brand)} •••• {card.last4}
                        </Text>
                        {card.exp_month > 0 && (
                          <Text
                            style={[
                              styles.cardExpiry,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Vence {String(card.exp_month).padStart(2, "0")}/
                            {card.exp_year}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSel ? colors.primary : colors.border,
                          },
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
                })
              )}

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
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Footer fijo ────────────────────────────────────────────── */}
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
        {paymentMethod === "card" && !selectedCardId && (
          <Text style={[styles.selectPayHint, { color: colors.textSecondary }]}>
            Selecciona una tarjeta guardada
          </Text>
        )}
        <Button
          title={
            paying
              ? "Procesando..."
              : `Pagar ${currency} ${subtotal.toFixed(2)}`
          }
          onPress={handlePay}
          fullWidth
          loading={paying}
          disabled={
            !paymentMethod ||
            (paymentMethod === "card" && !selectedCardId) ||
            paying
          }
          style={{
            borderRadius: BorderRadius.full,
            backgroundColor:
              paymentMethod === "simulated" ? "#F59E0B" : undefined,
          }}
        />
      </View>

      {/* Modales */}
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
      <CulqiWebViewModal
        visible={culqiModalVisible}
        amount={Math.round(subtotal * 100)}
        currency={(currency as string) || "PEN"}
        email={user?.email ?? ""}
        description={`Paku — ${productName ?? "Servicio"}`}
        onToken={handleCulqiToken}
        onClose={() => {
          setCulqiModalVisible(false);
          // Si el usuario cierra el modal sin pagar, marcar orden como fallida
          if (pendingOrderId) {
            orderService.failPayment(pendingOrderId).catch(() => {});
            setPendingOrderId(null);
          }
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
  addonDot: { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  addonLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },
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
  payOption: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    gap: 4,
    position: "relative",
    flexDirection: "column",
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
