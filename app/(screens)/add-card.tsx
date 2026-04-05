/**
 * add-card.tsx
 *
 * Pantalla para agregar una nueva tarjeta.
 *
 * Cómo funciona:
 * 1. Mostramos una preview de tarjeta (nativa) con la marca detectada.
 * 2. El formulario seguro corre dentro de un WebView usando el SDK de Mercado Pago
 *    (mp.cardForm + createCardToken). Los datos sensibles nunca pasan por JS nativo.
 * 3. La WebView nos envía el card_token via postMessage.
 * 4. Con ese token llamamos a paymentService.saveCard() y volvemos.
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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

import { Text } from "@/components/common/Text";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Icon } from "@/components/common";
import { paymentService } from "@/api/services/payment.service";
import { CONFIG } from "@/constants/config";

// Public key de Mercado Pago (modo TEST)
const MP_PUBLIC_KEY = CONFIG.MP_PUBLIC_KEY;

// ─── HTML del formulario seguro ────────────────────────────────────────────────

function buildMpFormHtml(
  bgColor: string,
  textColor: string,
  borderColor: string,
  primaryColor: string,
  MP_PUBLIC_KEY: string,
) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<title>Pago seguro</title>

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  body {
    padding: 16px 16px 20px;
  }

  .field-group { margin-bottom: 16px; }

  .field-label {
    font-size: 11px;
    font-weight: 700;
    color: ${textColor};
    margin-bottom: 7px;
    display: block;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    opacity: 0.7;
  }

  .mp-field {
    width: 100%;
    height: 52px;
    border: 1.5px solid ${borderColor};
    border-radius: 14px;
    background: ${bgColor};
    padding: 0 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .mp-input {
    width: 100%;
    height: 52px;
    border: 1.5px solid ${borderColor};
    border-radius: 14px;
    background: ${bgColor};
    padding: 0 16px;
    font-size: 15px;
    color: ${textColor};
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }

  .mp-field.focused {
    border-color: ${primaryColor};
    box-shadow: 0 0 0 3px ${primaryColor}22;
  }

  .mp-input:focus {
    border-color: ${primaryColor};
    box-shadow: 0 0 0 3px ${primaryColor}22;
  }

  .row {
    display: flex;
    gap: 12px;
  }

  .row .field-group {
    flex: 1;
  }

  #btn-tokenize {
    width: 100%;
    padding: 16px;
    background: ${primaryColor};
    color: #fff;
    border: none;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 4px;
    letter-spacing: 0.3px;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.15s;
  }

  #btn-tokenize:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  #btn-tokenize:active:not(:disabled) {
    opacity: 0.85;
  }

  .divider {
    height: 1px;
    background: ${borderColor};
    opacity: 0.5;
    margin: 16px 0;
  }

  .secure-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 16px;
  }

  .secure-text {
    font-size: 11px;
    color: ${textColor};
    opacity: 0.45;
  }

  .lock-icon {
    font-size: 12px;
    opacity: 0.45;
  }

  #status {
    font-size: 12px;
    text-align: center;
    margin-top: 8px;
    color: ${textColor};
  }

  #error-msg {
    color: #e53e3e;
    font-size: 12px;
    margin-top: 12px;
    text-align: center;
    display: none;
    padding: 10px 14px;
    background: #fff0f0;
    border-radius: 10px;
  }

  #loading-sdk {
    text-align: center;
    padding: 48px 0;
    color: ${textColor};
    opacity: 0.4;
    font-size: 13px;
  }
</style>
</head>

<body>

<div id="loading-sdk">Cargando formulario seguro...</div>

<div id="form-content" style="display:none">

  <div class="field-group">
    <label for="mp-cardNumber" class="field-label">Número de tarjeta</label>
    <div class="mp-field" id="mp-cardNumber"></div>
  </div>

  <div class="field-group">
    <label for="cardholderName" class="field-label">Nombre del titular</label>
    <input
      id="cardholderName"
      class="mp-input"
      type="text"
      placeholder="Como aparece en la tarjeta"
      autocomplete="cc-name"
    />
  </div>

  <div class="row">
    <div class="field-group">
      <label for="mp-expirationDate" class="field-label">Vencimiento</label>
      <div class="mp-field" id="mp-expirationDate"></div>
    </div>

    <div class="field-group">
      <label for="mp-securityCode" class="field-label">CVV</label>
      <div class="mp-field" id="mp-securityCode"></div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="secure-row">
    <span class="lock-icon">🔒</span>
    <span class="secure-text">Cifrado SSL · Mercado Pago</span>
  </div>

  <button type="button" id="btn-tokenize" disabled>
    Guardar tarjeta
  </button>

  <div id="error-msg"></div>
  <div id="status"></div>

</div>

<script>
document.addEventListener('DOMContentLoaded', function () {
  var mp;

  var fieldsReady = {
    cardNumber: false,
    expirationDate: false,
    securityCode: false,
  };

  function notify(type, payload) {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: type, ...payload })
    );
  }

  function checkAllReady() {
    var allReady =
      fieldsReady.cardNumber &&
      fieldsReady.expirationDate &&
      fieldsReady.securityCode;

    if (allReady) {
      document.getElementById('loading-sdk').style.display = 'none';
      document.getElementById('form-content').style.display = 'block';
      document.getElementById('btn-tokenize').disabled = false;
      notify('READY');
    }
  }

  function mountField(type, containerId, placeholder) {
    try {
      var field = mp.fields.create(type, {
        placeholder: placeholder,
        style: {
          color: '${textColor}',
          fontSize: '14px',
          fontFamily: '-apple-system, sans-serif',
          placeholderColor: '${textColor}88',
        },
      });

      field.mount(containerId);

      field.on('ready', function () {
        fieldsReady[type] = true;
        checkAllReady();
      });

      field.on('focus', function () {
        document.getElementById(containerId).classList.add('focused');
      });

      field.on('blur', function () {
        document.getElementById(containerId).classList.remove('focused');
      });

      field.on('validityChange', function (data) {
        document.getElementById(containerId).style.borderColor =
          data.errorMessages?.length ? '#e53e3e' : '${borderColor}';
      });

      return field;
    } catch (e) {
      notify('MOUNT_ERROR', { error: e.message || String(e) });
      return null;
    }
  }

  function loadSDK(callback) {
    var s = document.createElement('script');
    s.src = 'https://sdk.mercadopago.com/js/v2';

    s.onload = callback;

    s.onerror = function () {
      document.getElementById('loading-sdk').innerText =
        'Error cargando el formulario';
      notify('MOUNT_ERROR', {
        error: 'No se pudo cargar el SDK de Mercado Pago.',
      });
    };

    document.head.appendChild(s);
  }

  loadSDK(function () {
    try {
      mp = new MercadoPago('${MP_PUBLIC_KEY}');
      mountField('cardNumber', 'mp-cardNumber', '1234 5678 9012 3456');
      mountField('expirationDate', 'mp-expirationDate', 'MM/AA');
      mountField('securityCode', 'mp-securityCode', '•••');
    } catch (e) {
      notify('MOUNT_ERROR', { error: e.message || String(e) });
    }
  });

  document
    .getElementById('btn-tokenize')
    .addEventListener('click', async function () {
      var btn = this;
      var errEl = document.getElementById('error-msg');
      var statusEl = document.getElementById('status');
      var holderName = document
        .getElementById('cardholderName')
        .value.trim();

      if (!holderName) {
        errEl.textContent = 'Ingresa el nombre del titular.';
        errEl.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Procesando...';
      errEl.style.display = 'none';
      statusEl.textContent = '';

      try {
        var tokenResult = await mp.fields.createCardToken({
          cardholderName: holderName,
        });

        if (!tokenResult?.id) {
          throw new Error('No se pudo generar el token.');
        }

        notify('TOKEN_READY', {
          token: tokenResult.id,
          brand: tokenResult.payment_method_id || 'unknown',
        });
      } catch (e) {
        var msg = Array.isArray(e)
          ? e.map(function (x) {
              return x.message || x.cause || JSON.stringify(x);
            }).join(' · ')
          : e.message || JSON.stringify(e);

        errEl.textContent = msg;
        errEl.style.display = 'block';

        notify('TOKEN_ERROR', { error: msg });

        btn.disabled = false;
        btn.textContent = 'Guardar tarjeta';
      }
    });
});
</script>

</body>
</html>\``;
}

// ─── Preview de tarjeta nativa ─────────────────────────────────────────────────

type CardBrand = "visa" | "mastercard" | "amex" | "other";

function detectBrand(pm: string): CardBrand {
  const n = pm.toLowerCase();
  if (n.includes("visa")) return "visa";
  if (n.includes("master")) return "mastercard";
  if (n.includes("amex")) return "amex";
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

const CardPreview: React.FC<{ brand: CardBrand }> = ({ brand }) => (
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
    <Text style={cardStyles.number}>•••• •••• •••• ••••</Text>
    <View style={cardStyles.bottomRow}>
      <View>
        <Text style={cardStyles.metaLabel}>TITULAR</Text>
        <Text style={cardStyles.metaValue}>NOMBRE TITULAR</Text>
      </View>
      <View>
        <Text style={cardStyles.metaLabel}>VENCE</Text>
        <Text style={cardStyles.metaValue}>MM/AA</Text>
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

// ─── Pantalla principal ────────────────────────────────────────────────────────

export default function AddCardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const webViewRef = useRef<WebView>(null);

  const [brand, setBrand] = useState<CardBrand>("other");
  const [webViewReady, setWebViewReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const html = buildMpFormHtml(
    colors.surface,
    colors.text,
    colors.border,
    colors.primary,
    MP_PUBLIC_KEY,
  );

  const handleMessage = async (event: WebViewMessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    console.log("[AddCard] WebView message:", msg.type, msg);

    switch (msg.type) {
      case "READY":
        console.log("[AddCard] Formulario MP listo");
        setWebViewReady(true);
        break;

      case "TOKEN_READY":
        console.log(
          "[AddCard] Token obtenido:",
          msg.token?.slice(0, 12) + "...",
          "brand:",
          msg.brand,
        );
        setBrand(detectBrand(msg.brand || ""));
        setSaving(true);
        try {
          console.log("[AddCard] Llamando a paymentService.saveCard...");
          const saved = await paymentService.saveCard({
            card_token: msg.token,
          });
          console.log("[AddCard] Tarjeta guardada OK:", saved);
          Alert.alert(
            "¡Tarjeta guardada!",
            "Tu tarjeta fue agregada correctamente.",
            [{ text: "OK", onPress: () => router.back() }],
          );
        } catch (e: any) {
          console.error(
            "[AddCard] Error al guardar tarjeta:",
            e?.response?.status,
            e?.response?.data,
            e?.message,
          );
          const detail = e?.response?.data?.detail;
          const errorMsg =
            typeof detail === "string"
              ? detail
              : detail?.message ||
                "No se pudo guardar la tarjeta. Verifica los datos e intenta de nuevo.";
          Alert.alert("Error al guardar", errorMsg);
        } finally {
          setSaving(false);
        }
        break;

      case "TOKEN_ERROR":
        console.error("[AddCard] Error de tokenización MP:", msg.error);
        Alert.alert(
          "Error con la tarjeta",
          msg.error || "Verifica los datos de tu tarjeta.",
        );
        break;

      case "MOUNT_ERROR":
        console.error("[AddCard] Error al montar formulario MP:", msg.error);
        Alert.alert(
          "Error al cargar el formulario",
          msg.error || "Intenta de nuevo.",
        );
        break;

      default:
        console.log("[AddCard] Mensaje desconocido de WebView:", msg);
    }
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
            <CardPreview brand={brand} />
          </View>

          {/* Formulario seguro de Mercado Pago en WebView */}
          <View
            style={{
              borderRadius: BorderRadius.xl,
              overflow: "hidden",
              backgroundColor: colors.surface,
              ...Shadows.md,
              minHeight: 420,
            }}
          >
            <WebView
              ref={webViewRef}
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
              onError={(e) => {
                console.warn("WebView error:", e.nativeEvent);
                setWebViewReady(true);
              }}
              onHttpError={(e) => {
                console.warn("WebView HTTP error:", e.nativeEvent.statusCode);
              }}
              style={{ backgroundColor: "transparent", minHeight: 420 }}
            />

            {/* Overlay carga */}
            {!webViewReady && (
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
                <ActivityIndicator color={colors.primary} size="large" />
                <Text
                  style={{
                    marginTop: Spacing.md,
                    fontSize: Typography.fontSize.sm,
                    color: colors.textSecondary,
                    fontFamily: Typography.fontFamily.regular,
                  }}
                >
                  Cargando formulario seguro...
                </Text>
              </View>
            )}

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
          </View>

          {/* Nota MP */}
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
    </SafeAreaView>
  );
}
