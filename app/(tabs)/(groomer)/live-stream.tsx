import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { useGroomerStreaming } from "@/hooks/useGroomerStreaming";

export default function GroomerLiveStreamScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useTheme();

  const {
    localStream,
    streamState,
    isMuted,
    isFrontCamera,
    retryCount,
    startPreview,
    startStreaming,
    stopStreaming,
    toggleMic,
    flipCamera,
  } = useGroomerStreaming(orderId ?? "");

  // Iniciar preview de cámara al entrar
  useEffect(() => {
    startPreview();
  }, []);

  const handleStop = () => {
    Alert.alert(
      "Detener transmisión",
      "¿Estás seguro de que quieres terminar el live?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Detener",
          style: "destructive",
          onPress: () => {
            stopStreaming();
            router.back();
          },
        },
      ],
    );
  };

  const handleExit = () => {
    if (streamState === "live") {
      handleStop();
    } else {
      stopStreaming();
      router.back();
    }
  };

  const isLive = streamState === "live";
  const isConnecting = [
    "fetching_session",
    "connecting",
    "reconnecting",
  ].includes(streamState);

  // ── Overlay de estado sobre el preview ───────────────────────────────────

  const renderStateOverlay = () => {
    if (streamState === "idle" || streamState === "requesting_perms") {
      return (
        <View style={styles.stateOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.stateText}>Accediendo a la cámara...</Text>
        </View>
      );
    }

    if (isConnecting) {
      return (
        <View style={styles.stateOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.stateText}>
            {streamState === "reconnecting"
              ? `Reconectando... (${retryCount}/3)`
              : "Iniciando transmisión..."}
          </Text>
        </View>
      );
    }

    if (streamState === "failed") {
      return (
        <View style={styles.stateOverlay}>
          <Icon name="close" size={48} color="rgba(255,255,255,0.6)" />
          <Text style={styles.stateText}>No se pudo conectar</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={startStreaming}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Preview de cámara local */}
      {localStream ? (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.camera}
          objectFit="cover"
          mirror={isFrontCamera}
          zOrder={0}
        />
      ) : (
        <View style={[styles.camera, styles.cameraPlaceholder]}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}

      {/* Overlay de estado encima del video */}
      {renderStateOverlay()}

      {/* Header flotante */}
      <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleExit}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerOrderId} numberOfLines={1}>
              #{(orderId ?? "").slice(0, 8).toUpperCase()}
            </Text>
          </View>

          {/* Badge EN VIVO */}
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Controles inferiores */}
      <SafeAreaView style={styles.controlsOverlay} edges={["bottom"]}>
        <View style={styles.controlsRow}>
          {/* Micrófono */}
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={toggleMic}
          >
            <Icon name={isMuted ? "close" : "send"} size={22} color="#FFF" />
            <Text style={styles.controlLabel}>
              {isMuted ? "Mic off" : "Mic on"}
            </Text>
          </TouchableOpacity>

          {/* Botón principal — Iniciar / Detener */}
          {isLive ? (
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <View style={styles.stopBtnInner} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.startBtn,
                (isConnecting || !localStream) && styles.startBtnDisabled,
              ]}
              onPress={startStreaming}
              disabled={isConnecting || !localStream}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Icon name="visualize" size={28} color="#FFF" />
              )}
            </TouchableOpacity>
          )}

          {/* Cambiar cámara */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={flipCamera}
            disabled={isConnecting}
          >
            <Icon name="camera" size={22} color="#FFF" />
            <Text style={styles.controlLabel}>
              {isFrontCamera ? "Frontal" : "Trasera"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instrucción debajo */}
        <Text style={styles.hint}>
          {isLive
            ? "El cliente puede verte en tiempo real"
            : streamState === "preview"
              ? "Toca el botón para iniciar la transmisión"
              : ""}
        </Text>
      </SafeAreaView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#111",
  },
  cameraPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Estado overlay
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  stateText: {
    color: "#FFF",
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  retryBtn: {
    backgroundColor: "#1D2AD8",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  retryBtnText: {
    color: "#FFF",
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Header flotante
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, paddingHorizontal: Spacing.xs },
  headerOrderId: {
    color: "rgba(255,255,255,0.8)",
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 0.5,
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
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FFF" },
  liveText: {
    color: "#FFF",
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 1,
  },

  // Controles inferiores
  controlsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    gap: Spacing.sm,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: Spacing.md,
  },
  controlBtn: {
    alignItems: "center",
    gap: 4,
    width: 70,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  controlBtnActive: {
    backgroundColor: "rgba(255,50,50,0.4)",
  },
  controlLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
  },

  // Botón iniciar (círculo grande azul)
  startBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1D2AD8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  startBtnDisabled: {
    backgroundColor: "rgba(29,42,216,0.4)",
  },

  // Botón detener (cuadrado rojo dentro de círculo)
  stopBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(229,57,53,0.15)",
  },
  stopBtnInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#E53935",
  },

  hint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    paddingBottom: Spacing.xs,
  },
});
