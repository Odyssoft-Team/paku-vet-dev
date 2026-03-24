import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";
import { Text } from "@/components/common/Text";
import { Icon, IconName } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { useWebRTC } from "@/hooks/useWebRTC";

export default function LiveViewScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useTheme();

  const { remoteStream, connectionState, retryCount, connect, disconnect } =
    useWebRTC(orderId ?? "");

  // Conectar automáticamente al entrar
  useEffect(() => {
    connect();
  }, []);

  const handleExit = () => {
    disconnect();
    router.back();
  };

  const handleRetry = () => {
    connect();
  };

  // ── UI según estado ────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (connectionState) {
      // Video activo
      case "connected":
        return (
          <RTCView
            streamURL={remoteStream?.toURL() ?? ""}
            style={styles.video}
            objectFit="cover"
            mirror={false}
          />
        );

      case "fetching_session":
        return (
          <StatusOverlay
            icon={null}
            title="Verificando sesión..."
            subtitle="Obteniendo datos de la transmisión."
            colors={colors}
            showSpinner
          />
        );

      case "order_not_active":
        return (
          <StatusOverlay
            icon="close"
            title="Servicio no iniciado"
            subtitle="El servicio aún no está en curso. El live estará disponible cuando el groomer inicie el servicio."
            colors={colors}
            action={
              <Button
                title="Volver"
                onPress={handleExit}
                style={styles.retryButton}
              />
            }
          />
        );

      // Groomer no está en la sala todavía
      case "groomer_absent":
        return (
          <StatusOverlay
            icon="visualize"
            title="Transmisión no iniciada"
            subtitle="El groomer aún no ha comenzado el streaming. Intenta más tarde."
            colors={colors}
            action={
              <Button
                title="Reintentar"
                onPress={handleRetry}
                style={styles.retryButton}
              />
            }
          />
        );

      // Fallo de conexión
      case "failed":
        return (
          <StatusOverlay
            icon="close"
            title="No se pudo conectar"
            subtitle="Verifica tu conexión e inténtalo de nuevo."
            colors={colors}
            action={
              <Button
                title="Reintentar"
                onPress={handleRetry}
                style={styles.retryButton}
              />
            }
          />
        );

      // Reconectando automáticamente con backoff
      case "reconnecting":
        return (
          <StatusOverlay
            icon={null}
            title={`Reconectando... (${retryCount}/4)`}
            subtitle="Se perdió la conexión. Intentando restablecer automáticamente."
            colors={colors}
            showSpinner
          />
        );

      // Caída temporal
      case "disconnected":
        return (
          <StatusOverlay
            icon="visualize"
            title="Conexión inestable"
            subtitle="Detectando reconexión automática..."
            colors={colors}
            showSpinner
          />
        );

      // Conectando / enviando offer / esperando
      default:
        return (
          <StatusOverlay
            icon={null}
            title={
              connectionState === "calling"
                ? "Conectando llamada..."
                : "Conectando al live..."
            }
            subtitle="Esto puede tomar unos segundos."
            colors={colors}
            showSpinner
          />
        );
    }
  };

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Video o estado */}
      {renderContent()}

      {/* Header flotante sobre el video */}
      <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
        <View style={styles.headerRow}>
          {/* Botón cerrar */}
          <TouchableOpacity
            onPress={handleExit}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={22} color="#FFF" />
          </TouchableOpacity>

          {/* Badge EN VIVO */}
          {connectionState === "connected" && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Componente auxiliar para estados de espera/error ──────────────────────────

interface StatusOverlayProps {
  icon: IconName | null;
  title: string;
  subtitle: string;
  colors: any;
  showSpinner?: boolean;
  action?: React.ReactNode;
}

const StatusOverlay: React.FC<StatusOverlayProps> = ({
  icon,
  title,
  subtitle,
  colors,
  showSpinner = false,
  action,
}) => (
  <View style={styles.overlayContainer}>
    {showSpinner ? (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.spinner}
      />
    ) : icon ? (
      <Icon
        name={icon}
        size={56}
        color={colors.textSecondary}
        style={styles.overlayIcon}
      />
    ) : null}
    <Text style={styles.overlayTitle}>{title}</Text>
    <Text style={styles.overlaySubtitle}>{subtitle}</Text>
    {action}
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Header flotante sobre el video
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  liveText: {
    color: "#FFF",
    fontSize: Typography.fontSize.xs,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1,
  },
  // Estados de espera / error
  overlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  spinner: {
    marginBottom: Spacing.lg,
  },
  overlayIcon: {
    marginBottom: Spacing.lg,
  },
  overlayTitle: {
    color: "#FFF",
    fontSize: Typography.fontSize.lg,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  overlaySubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: Typography.fontSize.sm,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    minWidth: 160,
  },
});
