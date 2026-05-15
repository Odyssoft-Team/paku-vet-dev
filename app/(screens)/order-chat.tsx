/**
 * order-chat.tsx
 *
 * Pantalla de chat entre usuario y groomer durante una orden.
 *
 * Params esperados:
 *   orderId      — ID de la orden
 *   orderStatus  — Estado actual (on_the_way | in_service | done | cancelled)
 *   contactName  — Nombre del contacto del otro lado (opcional, fallback por rol)
 */

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/store/authStore";
import type { ChatMessage } from "@/types/chat.types";

const ACTIVE_STATUSES = ["on_the_way", "in_service"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Burbuja de mensaje ───────────────────────────────────────────────────────

interface BubbleProps {
  message: ChatMessage;
  isMe: boolean;
  contactInitials: string;
  colors: any;
  isFirst: boolean; // primer mensaje consecutivo del mismo sender
}

function MessageBubble({
  message,
  isMe,
  contactInitials,
  colors,
  isFirst,
}: BubbleProps) {
  return (
    <View
      style={[
        styles.bubbleWrapper,
        isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperThem,
      ]}
    >
      {/* Avatar del contacto — solo en el primer mensaje consecutivo */}
      {!isMe && (
        <View style={styles.avatarSlot}>
          {isFirst ? (
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {contactInitials}
              </Text>
            </View>
          ) : (
            <View style={styles.avatarSpacer} />
          )}
        </View>
      )}

      <View style={{ maxWidth: "72%", gap: 2 }}>
        <View
          style={[
            styles.bubble,
            isMe
              ? [styles.bubbleMe, { backgroundColor: colors.primary }]
              : [
                  styles.bubbleThem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border + "80",
                  },
                ],
          ]}
        >
          <Text
            style={[styles.bubbleText, { color: isMe ? "#FFF" : colors.text }]}
          >
            {message.body}
          </Text>
        </View>

        {/* Hora + tick de leído */}
        <View
          style={[
            styles.metaRow,
            { justifyContent: isMe ? "flex-end" : "flex-start" },
          ]}
        >
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatTime(message.created_at)}
          </Text>
          {isMe && (
            <Text
              style={[
                styles.tickText,
                {
                  color: message.is_read
                    ? colors.primary
                    : colors.textSecondary,
                },
              ]}
            >
              {message.is_read ? " ✓✓" : " ✓"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────

function EmptyChat({
  contactName,
  colors,
}: {
  contactName: string;
  colors: any;
}) {
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}
      >
        <Text style={{ fontSize: 32 }}>💬</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Sin mensajes aún
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Escríbele a {contactName}.{"\n"}Recibirás una notificación cuando
        responda.
      </Text>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function OrderChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    orderId: string;
    orderStatus: string;
    contactName?: string;
  }>();

  const orderId = params.orderId ?? "";
  const orderStatus = params.orderStatus ?? "done";
  const canSend = ACTIVE_STATUSES.includes(orderStatus);

  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? "";
  const isGroomer = user?.role === "ally";

  // Nombre del contacto: usar el param si viene, sino fallback por rol
  const contactName = params.contactName ?? (isGroomer ? "Usuario" : "Groomer");

  const contactInitials = getInitials(contactName);

  const { messages, loading, error, sendMessage } = useChat(orderId);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    await sendMessage(text);
    setSending(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const handleBack = () => {
    if (isGroomer) {
      router.push("/(tabs)/(groomer)/appointments");
    } else {
      router.push("/(tabs)/(user)/(menu)/tracking-service");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border + "60",
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Avatar del contacto */}
        <View
          style={[
            styles.headerAvatar,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Text style={[styles.headerAvatarText, { color: colors.primary }]}>
            {contactInitials}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          <Text
            style={[styles.headerName, { color: colors.text }]}
            numberOfLines={1}
          >
            {contactName}
          </Text>
          <View style={styles.onlineRow}>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: canSend ? "#10B981" : "#9CA3AF" },
              ]}
            />
            <Text
              style={[styles.headerStatus, { color: colors.textSecondary }]}
            >
              {canSend ? "En línea" : "Servicio finalizado"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Banner solo lectura ─────────────────────────────────────────── */}
      {!canSend && (
        <View
          style={[
            styles.readonlyBanner,
            { backgroundColor: colors.border + "40" },
          ]}
        >
          <Icon name="close" size={12} color={colors.textSecondary} />
          <Text style={[styles.readonlyText, { color: colors.textSecondary }]}>
            Servicio finalizado — solo puedes leer el historial
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Lista de mensajes ────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando mensajes...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={{ fontSize: 32 }}>⚠️</Text>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              No se pudieron cargar los mensajes.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.listContent,
              messages.length === 0 && { flex: 1 },
            ]}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isFirst = !prevMsg || prevMsg.sender_id !== item.sender_id;
              return (
                <MessageBubble
                  message={item}
                  isMe={item.sender_id === currentUserId}
                  contactInitials={contactInitials}
                  colors={colors}
                  isFirst={isFirst}
                />
              );
            }}
            ListEmptyComponent={
              <EmptyChat contactName={contactName} colors={colors} />
            }
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* ── Input de mensaje ─────────────────────────────────────────── */}
        {canSend && (
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border + "60",
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={input}
              onChangeText={setInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.textSecondary + "80"}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    input.trim() && !sending ? colors.primary : colors.border,
                },
              ]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Icon name="send" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerStatus: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },

  // Banner solo lectura
  readonlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  readonlyText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },

  // Lista
  listContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.lg,
  },

  // Burbujas
  bubbleWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
    gap: 6,
    paddingHorizontal: Spacing.xs,
  },
  bubbleWrapperMe: { justifyContent: "flex-end" },
  bubbleWrapperThem: { justifyContent: "flex-start" },
  avatarSlot: { width: 30 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSpacer: { width: 30, height: 30 },
  avatarText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "transparent",
  },
  bubbleMe: {
    borderBottomRightRadius: 5,
  },
  bubbleThem: {
    borderBottomLeftRadius: 5,
  },
  bubbleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
  },
  tickText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Estado vacío
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    lineHeight: 22,
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  // Loading / error
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
