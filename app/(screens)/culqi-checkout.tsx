/**
 * culqi-checkout.tsx
 *
 * Pantalla dedicada para el checkout de Culqi.
 * Al ser una pantalla completa (no un Modal), no hay conflicto de capas
 * y el formulario de Culqi se ve limpio sin nada detrás.
 *
 * Flujo:
 * 1. cart.tsx navega aquí pasando: amount, currency, email, description, orderId
 * 2. Esta pantalla carga el SDK de Culqi en una WebView a pantalla completa
 * 3. Al obtener el token → navega a cart con culqiToken + culqiOrderId
 * 4. Al cerrar sin pagar (X de Culqi) → navega de vuelta a cart sin params
 */

import React from "react";
import { View, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/common/Text";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";
import { CONFIG } from "@/constants/config";

// ─── HTML del checkout de Culqi ───────────────────────────────────────────────

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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f5f5f5; font-family: sans-serif; }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .loading { color: #666; font-size: 14px; }
    .error { color: #e53e3e; font-size: 13px; margin-top: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="loading" id="loadingMsg">Cargando pasarela segura...</div>
    <div class="error" id="errorMsg"></div>
  </div>

  <script src="https://checkout.culqi.com/js/v4"></script>
  <script>
    window.addEventListener('load', function() {
      if (typeof Culqi === 'undefined') {
        document.getElementById('loadingMsg').style.display = 'none';
        document.getElementById('errorMsg').innerText = 'No se pudo cargar el SDK de Culqi.';
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CULQI_ERROR',
          message: 'No se pudo cargar el SDK de Culqi'
        }));
        return;
      }

      try {
        Culqi.publicKey = '${publicKey}';

        Culqi.settings({
          title: 'Paku',
          currency: '${currency}',
          amount: ${amount},
          description: '${description.replace(/'/g, "\\'")}',
        });

        // Callback reservado del SDK — se llama al tokenizar o al cerrar/error
        window.culqi = function() {
          if (Culqi.token) {
            window._culqiTokenReceived = true;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CULQI_TOKEN',
              token: Culqi.token.id,
              email: Culqi.token.email,
            }));
          } else if (Culqi.error) {
            // Culqi llama a window.culqi() con error cuando el usuario
            // cierra el modal SIN pagar (toca la X interna de Culqi)
            var err = Culqi.error;
            var isUserClose =
              err.type === 'client_unauthorized' ||
              err.merchant_message === 'El usuario cerró el modal' ||
              !err.user_message;

            if (isUserClose) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CULQI_CLOSED',
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CULQI_ERROR',
                message: err.user_message || err.merchant_message || 'Error en el pago',
              }));
            }
          } else {
            // Sin token ni error = usuario cerró el modal
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CULQI_CLOSED',
            }));
          }
        };

        document.getElementById('loadingMsg').style.display = 'none';
        Culqi.open();

        // Detectar cuando el usuario cierra la X de Culqi.
        // Culqi inyecta un iframe en el body al abrirse.
        // Esperamos a que aparezca ese iframe, luego observamos si desaparece.
        var checkIframeInterval = setInterval(function() {
          var iframe = document.querySelector('iframe');
          if (iframe) {
            clearInterval(checkIframeInterval);
            // El iframe ya existe — ahora observamos si desaparece
            var observer = new MutationObserver(function(mutations) {
              var iframeStillExists = document.querySelector('iframe');
              if (!iframeStillExists) {
                observer.disconnect();
                // Solo enviamos CULQI_CLOSED si no hubo token aún
                if (!window._culqiTokenReceived) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'CULQI_CLOSED',
                  }));
                }
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
          }
        }, 300);

      } catch(e) {
        document.getElementById('loadingMsg').style.display = 'none';
        document.getElementById('errorMsg').innerText = 'Error: ' + e.message;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CULQI_ERROR',
          message: e.message
        }));
      }
    });
  </script>
</body>
</html>
`;

// ─── Pantalla ─────────────────────────────────────────────────────────────────

const CART_PATH = "/(tabs)/(user)/(menu)/cart" as const;

export default function CulqiCheckoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    amount: string;
    currency: string;
    email: string;
    description: string;
    orderId: string;
  }>();

  const amount = Number(params.amount ?? "0");
  const currency = params.currency ?? "PEN";
  const email = params.email ?? "";
  const description = params.description ?? "Paku";
  const orderId = params.orderId ?? "";
  const publicKey = CONFIG.CULQI_PUBLIC_KEY;

  const goBackToCart = () => {
    router.push(CART_PATH);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("[CulqiCheckout] mensaje:", data.type, data);

      if (data.type === "CULQI_TOKEN" && data.token) {
        // Token obtenido — volver a cart con los datos para procesar el cargo
        router.push({
          pathname: CART_PATH,
          params: {
            culqiToken: data.token,
            culqiOrderId: orderId,
          },
        });
      } else if (data.type === "CULQI_CLOSED") {
        // Usuario cerró el modal de Culqi sin pagar — volver al carrito
        console.log("[CulqiCheckout] Usuario cerró el modal de Culqi");
        goBackToCart();
      } else if (data.type === "CULQI_ERROR") {
        Alert.alert("Error en el pago", data.message || "Ocurrió un error.", [
          { text: "OK", onPress: goBackToCart },
        ]);
      }
    } catch (e) {
      console.error("[CulqiCheckout] Error parseando mensaje:", e);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* WebView a pantalla completa — sin header nativo, la X de Culqi es suficiente */}
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
            style={[styles.loading, { backgroundColor: colors.background }]}
          >
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando pasarela de pago...
            </Text>
          </View>
        )}
        style={{ flex: 1, backgroundColor: colors.background }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
  },
});
