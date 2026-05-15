/**
 * useChat.ts
 *
 * Hook que encapsula toda la lógica del chat de una orden:
 * - Carga inicial del historial
 * - Polling cada 3s mientras la pantalla está activa
 * - Pausa el polling en background (AppState)
 * - Envío de mensajes con actualización optimista
 * - Cursor para no re-traer mensajes ya recibidos
 *
 * Uso:
 *   const { messages, loading, error, sendMessage } = useChat(orderId);
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { chatService } from "@/api/services/chat.service";
import type { ChatMessage } from "@/types/chat.types";

const POLL_INTERVAL_MS = 3000; // 3s en foreground
const POLL_INTERVAL_BG_MS = 10000; // 10s en background

export function useChat(orderId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cursor: created_at del último mensaje recibido
  const cursorRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const cancelledRef = useRef(false);

  // ─── Polling tick ────────────────────────────────────────────────────────

  const pollMessages = useCallback(async () => {
    if (cancelledRef.current) return;
    try {
      const since = cursorRef.current ?? undefined;
      const newMsgs = await chatService.getMessages(orderId, since);
      if (!cancelledRef.current && newMsgs.length > 0) {
        setMessages((prev) => [...prev, ...newMsgs]);
        cursorRef.current = newMsgs[newMsgs.length - 1].created_at;
      }
    } catch {
      // Polling silencioso — no romper la UI por un fallo temporal
    }
  }, [orderId]);

  // ─── Control del intervalo ───────────────────────────────────────────────

  const startPolling = useCallback(
    (intervalMs = POLL_INTERVAL_MS) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(pollMessages, intervalMs);
    },
    [pollMessages],
  );

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ─── AppState: pausar/reanudar según foreground/background ───────────────

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const prev = appStateRef.current;
        appStateRef.current = nextState;

        if (prev.match(/inactive|background/) && nextState === "active") {
          // App vuelve a primer plano — polling rápido
          pollMessages(); // fetch inmediato
          startPolling(POLL_INTERVAL_MS);
        } else if (nextState.match(/inactive|background/)) {
          // App va a background — polling lento para conservar batería
          startPolling(POLL_INTERVAL_BG_MS);
        }
      },
    );

    return () => subscription.remove();
  }, [pollMessages, startPolling]);

  // ─── Carga inicial + arranque de polling ─────────────────────────────────

  useEffect(() => {
    cancelledRef.current = false;
    cursorRef.current = null;

    const fetchInitial = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await chatService.getMessages(orderId);
        if (!cancelledRef.current) {
          setMessages(data);
          if (data.length > 0) {
            cursorRef.current = data[data.length - 1].created_at;
          }
        }
      } catch (e: any) {
        if (!cancelledRef.current) {
          setError(e?.message ?? "Error al cargar mensajes");
        }
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    };

    fetchInitial().then(() => {
      if (!cancelledRef.current) startPolling();
    });

    return () => {
      cancelledRef.current = true;
      stopPolling();
    };
  }, [orderId]);

  // ─── Enviar mensaje ──────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (body: string): Promise<ChatMessage | null> => {
      const trimmed = body.trim();
      if (!trimmed || trimmed.length > 2000) return null;

      try {
        const newMsg = await chatService.sendMessage(orderId, {
          body: trimmed,
        });

        // Actualización optimista — agregar inmediatamente
        setMessages((prev) => [...prev, newMsg]);
        cursorRef.current = newMsg.created_at;

        return newMsg;
      } catch (e: any) {
        setError(e?.message ?? "Error al enviar mensaje");
        return null;
      }
    },
    [orderId],
  );

  return { messages, loading, error, sendMessage };
}

// ─── Hook auxiliar: badge de no leídos ───────────────────────────────────────

/**
 * Consulta el contador de mensajes no leídos cada 10s.
 * Se usa en tracking-service.tsx para mostrar el badge en el botón de chat.
 */
export function useUnreadCount(orderId: string | null): number {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) {
      setCount(0);
      return;
    }

    const fetch_ = async () => {
      try {
        const n = await chatService.getUnreadCount(orderId);
        setCount(n);
      } catch {
        // silencioso
      }
    };

    fetch_();
    intervalRef.current = setInterval(fetch_, 10_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId]);

  return count;
}
