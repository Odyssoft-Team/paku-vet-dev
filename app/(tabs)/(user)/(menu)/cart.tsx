/**
 * cart.tsx
 *
 * Pantalla de carrito / checkout.
 *
 * Flujo de pago con tarjeta:
 * 1. Cargamos las tarjetas guardadas reales desde el backend de MP.
 * 2. El usuario selecciona una tarjeta guardada.
 * 3. Para confirmar el pago se necesita re-tokenizar el CVV con el SDK de MP
 *    (igual que en el index2.html de ejemplo). Eso ocurre en una WebView modal.
 * 4. Con el card_token del CVV + saved_payment_method_id llamamos a paymentService.pay().
 * 5. Hacemos polling del estado hasta PAID / FAILED.
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

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
import { paymentService } from "@/api/services/payment.service";
import { CONFIG } from "@/constants/config";
import { useStoreProduct } from "@/hooks/useStoreProduct";
import { useSavedCards } from "@/hooks/useSavedCards";

// Public key de Mercado Pago (modo TEST)
const MP_PUBLIC_KEY = CONFIG.MP_PUBLIC_KEY;

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

// ─── HTML para WebView de CVV (pago con tarjeta guardada) ─────────────────────

function buildCvvHtml(
  card: SavedPaymentMethod,
  bgColor: string,
  textColor: string,
  borderColor: string,
  primaryColor: string,
) {
  const mpCardId = card.mp_card_id || "";
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: transparent; font-family: -apple-system, sans-serif; padding: 0; }
  .field-label { font-size: 12px; font-weight: 600; color: ${textColor}; margin-bottom: 6px; display: block; }
  .mp-field { height: 48px; border: 1.5px solid ${borderColor}; border-radius: 12px; background: ${bgColor}; padding: 0 14px; margin-bottom: 16px; }
  #btn-pay { width: 100%; padding: 15px; background: ${primaryColor}; color: #fff; border: none; border-radius: 50px; font-size: 15px; font-weight: 700; cursor: pointer; }
  #btn-pay:disabled { opacity: 0.5; }
  #error-msg { color: #e53e3e; font-size: 12px; margin-top: 10px; text-align: center; display: none; }
</style>
</head>
<body>
  <label class="field-label">Código de seguridad (CVV)</label>
  <div class="mp-field" id="mp-cvv-container"></div>
  <button id="btn-pay" disabled>Confirmar pago</button>
  <div id="error-msg"></div>

<script>
  var mp;
  var mpCardId = '${mpCardId}';

  function loadSDK(callback) {
    var s = document.createElement('script');
    s.src = 'https://sdk.mercadopago.com/js/v2';
    s.onload = callback;
    s.onerror = function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CVV_TOKEN_ERROR', error: 'No se pudo cargar el SDK. Verifica tu conexión.' }));
    };
    document.head.appendChild(s);
  }

  loadSDK(function() {
    mp = new MercadoPago('${MP_PUBLIC_KEY}');
    var cvvField = mp.fields.create('securityCode', {
      placeholder: '•••',
      style: { color: '${textColor}', fontSize: '16px', fontFamily: '-apple-system, sans-serif' }
    });
    cvvField.mount('mp-cvv-container');

    cvvField.on('ready', function() {
      document.getElementById('btn-pay').disabled = false;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CVV_READY' }));
    });

    cvvField.on('validityChange', function(data) {
      document.getElementById('btn-pay').disabled = data.errorMessages && data.errorMessages.length > 0;
    });
  });

  document.getElementById('btn-pay').addEventListener('click', async function() {
    var btn = document.getElementById('btn-pay');
    var errEl = document.getElementById('error-msg');
    btn.disabled = true;
    btn.textContent = 'Procesando...';
    errEl.style.display = 'none';
    try {
      var tokenResult = await mp.fields.createCardToken({ cardId: mpCardId });
      if (!tokenResult || !tokenResult.id) throw new Error('No se pudo generar el token.');
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CVV_TOKEN_READY', token: tokenResult.id }));
    } catch(e) {
      var msg = Array.isArray(e)
        ? e.map(function(x) { return x.message || JSON.stringify(x); }).join(' · ')
        : (e.message || 'Error');
      errEl.textContent = msg;
      errEl.style.display = 'block';
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CVV_TOKEN_ERROR', error: msg }));
      btn.disabled = false;
      btn.textContent = 'Confirmar pago';
    }
  });
</script>
</body>
</html>`;
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

// ─── CVV Modal (WebView de Mercado Pago) ──────────────────────────────────────

interface CvvModalProps {
  visible: boolean;
  card: SavedPaymentMethod | null;
  onClose: () => void;
  onTokenReady: (token: string) => void;
  colors: any;
}

const CvvModal: React.FC<CvvModalProps> = ({
  visible,
  card,
  onClose,
  onTokenReady,
  colors,
}) => {
  const [cvvReady, setCvvReady] = useState(false);

  useEffect(() => {
    if (!visible) setCvvReady(false);
  }, [visible]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    console.log("[CvvModal] WebView message:", msg.type, msg);
    if (msg.type === "CVV_READY") setCvvReady(true);
    if (msg.type === "CVV_TOKEN_READY") {
      console.log("[CvvModal] Token CVV OK:", msg.token?.slice(0, 12) + "...");
      onTokenReady(msg.token);
    }
    if (msg.type === "CVV_TOKEN_ERROR") {
      console.error("[CvvModal] Error CVV:", msg.error);
      Alert.alert(
        "Error con CVV",
        msg.error || "Verifica el código de seguridad.",
      );
    }
  };

  if (!card) return null;

  const html = buildCvvHtml(
    card,
    colors.surface,
    colors.text,
    colors.border,
    colors.primary,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: Spacing.lg,
              paddingBottom: 40,
            }}
          >
            {/* Header del modal */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: Spacing.lg,
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: Typography.fontFamily.bold,
                    fontSize: Typography.fontSize.md,
                    color: colors.text,
                  }}
                >
                  Confirmar pago
                </Text>
                <Text
                  style={{
                    fontFamily: Typography.fontFamily.regular,
                    fontSize: Typography.fontSize.xs,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {getBrandLabel(card.brand)} •••• {card.last4} · Vence{" "}
                  {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* WebView con el campo CVV de MP */}
            <View
              style={{
                height: 130,
                borderRadius: BorderRadius.lg,
                overflow: "hidden",
                backgroundColor: colors.surface,
              }}
            >
              <WebView
                originWhitelist={["*"]}
                source={{ html, baseUrl: "https://paku.dev-qa.site" }}
                onMessage={handleMessage}
                scrollEnabled={false}
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                mixedContentMode="always"
                allowFileAccessFromFileURLs
                allowUniversalAccessFromFileURLs
                style={{ backgroundColor: "transparent", height: 130 }}
              />
              {!cvvReady && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.surface,
                  }}
                >
                  <ActivityIndicator color={colors.primary} size="small" />
                </View>
              )}
            </View>

            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: colors.textSecondary,
                fontFamily: Typography.fontFamily.regular,
                textAlign: "center",
                marginTop: Spacing.sm,
              }}
            >
              🔒 CVV cifrado con SSL · Mercado Pago
            </Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

type PaymentMethod = "card" | null;

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

  // Tarjetas guardadas desde el backend
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
  const [cvvModalVisible, setCvvModalVisible] = useState(false);

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

  // Tarjeta seleccionada
  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  const handleInvoiceToggle = (option: "si" | "no") => {
    setInvoiceOption(option);
    if (option === "si") router.push("/(tabs)/(user)/invoice-form");
    else removeInvoice();
  };

  // Paso 1: crear carrito y hacer checkout, luego abrir el modal de CVV
  const handlePay = async () => {
    if (!paymentMethod || !selectedCardId) return;
    if (!selectedCard) {
      Alert.alert(
        "Selecciona una tarjeta",
        "Elige una tarjeta guardada para continuar.",
      );
      return;
    }

    // Crear carrito primero
    console.log(
      "[Cart] Iniciando pago — método:",
      paymentMethod,
      "tarjeta:",
      selectedCardId,
    );
    console.log(
      "[Cart] Datos tarjeta seleccionada:",
      JSON.stringify(selectedCard),
    );
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
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        "Ocurrió un error al preparar el carrito.";
      Alert.alert("Error", message);
      setPaying(false);
      return;
    }
    setPaying(false);

    // Abrir modal de CVV para re-tokenizar
    setCvvModalVisible(true);
  };

  // Paso 2: recibimos el card_token del CVV → procesar el pago real con MP
  const handleCvvToken = async (cardToken: string) => {
    console.log("[Cart] CVV token recibido:", cardToken?.slice(0, 12) + "...");
    setCvvModalVisible(false);
    setPaying(true);

    try {
      const { cartId } = useBookingStore.getState();

      // Llamar al endpoint de pago con tarjeta guardada
      console.log("[Cart] Enviando pago:", {
        cart_id: cartId,
        amount: Math.round(subtotal * 100),
        saved_payment_method_id: selectedCard!.id,
      });
      const paymentResult = await paymentService.pay({
        cart_id: cartId!,
        amount: Math.round(subtotal * 100), // en centimos
        currency: currency || "PEN",
        saved_payment_method_id: selectedCard!.id,
        card_token: cardToken,
        installments: 1,
      });
      console.log("[Cart] Respuesta pago:", paymentResult);

      // Esperar estado final (PAID / FAILED)
      const finalStatus = await paymentService.waitForFinalStatus(
        paymentResult.order_id,
      );
      console.log("[Cart] Estado final:", finalStatus);

      if (finalStatus.status === "PAID") {
        // Crear la orden en el backend principal de Paku
        const newOrder = await orderService.createOrder({
          cart_id: useBookingStore.getState().cartId!,
          address_id: addressId!,
        });
        setOrder(newOrder);
        setSuccessVisible(true);
      } else if (finalStatus.status === "FAILED") {
        Alert.alert(
          "Pago rechazado",
          "Tu tarjeta fue rechazada. Verifica los datos o intenta con otra tarjeta.",
        );
      } else {
        Alert.alert(
          "Pago pendiente",
          `El estado del pago es: ${finalStatus.status}. Te notificaremos cuando se confirme.`,
        );
      }
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const code = typeof detail === "object" ? detail?.code : null;

      const errorMessages: Record<string, string> = {
        card_declined: "Tu tarjeta fue declinada. Contacta a tu banco.",
        insufficient_funds: "Fondos insuficientes en tu tarjeta.",
        invalid_card_token:
          "Error con el código de seguridad. Inténtalo de nuevo.",
        fraud_detected:
          "Tu banco bloqueó el pago por seguridad. Contacta a tu banco.",
      };

      const userMsg =
        errorMessages[code] ||
        (typeof detail === "string" ? detail : detail?.message) ||
        "Ocurrió un error al procesar tu pago.";

      Alert.alert("Error al procesar", userMsg);
    } finally {
      setPaying(false);
    }
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

          {/* Selector: solo tarjeta por ahora (Yape se conectará cuando el backend lo soporte) */}
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
                paymentMethod === "card" ? colors.primary : colors.textSecondary
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
                        <Text
                          style={[
                            styles.cardExpiry,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Vence {String(card.exp_month).padStart(2, "0")}/
                          {card.exp_year}
                        </Text>
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
          style={{ borderRadius: BorderRadius.full }}
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
      <CvvModal
        visible={cvvModalVisible}
        card={selectedCard}
        onClose={() => setCvvModalVisible(false)}
        onTokenReady={handleCvvToken}
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
