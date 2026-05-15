/**
 * order-chat.tsx
 *
 * Pantalla de chat entre el usuario y el ally durante una orden.
 *
 * Acceso:
 *   - Desde tracking-service.tsx cuando status === "on_the_way" o "in_service"
 *   - Desde order-detail.tsx para ver el historial (status done/cancelled)
 *
 * Comportamiento según estado:
 *   on_the_way / in_service → puede leer y enviar mensajes
 *   done / cancelled        → solo lectura, input oculto
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
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/store/authStore";
import type { ChatMessage } from "@/types/chat.types";

// ─── Tipos de estado que permiten enviar mensajes ─────────────────────────────

const ACTIVE_STATUSES = ["on_the_way", "in_service"];

// ─── Burbuja de mensaje ───────────────────────────────────────────────────────

interface BubbleProps {
  message: ChatMessage;
  isMe: boolean;
  colors: any;
}

function MessageBubble({ message, isMe, colors }: BubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={[
        bubbleStyles.wrapper,
        isMe ? bubbleStyles.wrapperMe : bubbleStyles.wrapperThem,
      ]}
    >
      {!isMe && (
        <View
          style={[
            bubbleStyles.avatar,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Text style={{ fontSize: 14 }}>🐾</Text>
        </View>
      )}
      <View style={{ maxWidth: "78%", gap: 2 }}>
        <View
          style={[
            bubbleStyles.bubble,
            isMe
              ? [bubbleStyles.bubbleMe, { backgroundColor: colors.primary }]
              : [
                  bubbleStyles.bubbleThem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ],
          ]}
        >
          <Text
            style={[bubbleStyles.body, { color: isMe ? "#FFF" : colors.text }]}
          >
            {message.body}
          </Text>
        </View>
        <Text
          style={[
            bubbleStyles.time,
            {
              color: colors.textSecondary,
              textAlign: isMe ? "right" : "left",
            },
          ]}
        >
          {time}
          {isMe && (
            <Text
              style={{
                color: message.is_read ? colors.primary : colors.textSecondary,
              }}
            >
              {" "}
              {message.is_read ? "✓✓" : "✓"}
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  wrapperMe: { justifyContent: "flex-end" },
  wrapperThem: { justifyContent: "flex-start" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  body: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    paddingHorizontal: 4,
  },
});

// ─── Estado vacío ─────────────────────────────────────────────────────────────

function EmptyChat({ colors }: { colors: any }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
      }}
    >
      <Text style={{ fontSize: 40 }}>💬</Text>
      <Text
        style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.bold,
          color: colors.text,
          textAlign: "center",
        }}
      >
        Sin mensajes aún
      </Text>
      <Text
        style={{
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.regular,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Puedes escribirle a tu groomer aquí. Recibirás una notificación cuando
        te responda.
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
  }>();

  const orderId = params.orderId ?? "";
  const orderStatus = params.orderStatus ?? "done";
  const canSend = ACTIVE_STATUSES.includes(orderStatus);

  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? "";

  const { messages, loading, error, sendMessage } = useChat(orderId);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Scroll al último mensaje cuando llegan nuevos
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    await sendMessage(text);
    setSending(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
      gap: Spacing.md,
    },
    headerBack: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    headerInfo: { flex: 1 },
    headerName: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
    },
    headerSub: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
    },
    readonlyBanner: {
      backgroundColor: colors.border + "60",
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      alignItems: "center",
    },
    readonlyText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
    },
    list: { flex: 1 },
    listContent: {
      paddingVertical: Spacing.md,
      paddingBottom: Spacing.lg,
      flexGrow: 1,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingBottom: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      gap: Spacing.sm,
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      maxHeight: 100,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      backgroundColor: colors.border,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    },
    errorText: {
      color: colors.error ?? "#EF4444",
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      textAlign: "center",
      padding: Spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => router.push("/(tabs)/(user)/(menu)/tracking-service")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          <Text style={{ fontSize: 18 }}>🐾</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Groomer asignado</Text>
          <Text style={styles.headerSub}>
            {canSend ? "En línea" : "Servicio finalizado"}
          </Text>
        </View>
      </View>

      {/* Banner solo lectura */}
      {!canSend && (
        <View style={styles.readonlyBanner}>
          <Text style={styles.readonlyText}>
            🔒 El servicio ha finalizado — solo puedes leer el historial
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Lista de mensajes */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: Typography.fontFamily.regular,
                fontSize: Typography.fontSize.sm,
              }}
            >
              Cargando mensajes...
            </Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>
            No se pudieron cargar los mensajes. Intenta de nuevo.
          </Text>
        ) : (
          <FlatList
            ref={listRef}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              messages.length === 0 && { flex: 1 },
            ]}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMe={item.sender_id === currentUserId}
                colors={colors}
              />
            )}
            ListEmptyComponent={<EmptyChat colors={colors} />}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input — solo si puede enviar */}
        {canSend && (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
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
                (!input.trim() || sending) && styles.sendBtnDisabled,
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
