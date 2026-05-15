/**
 * chat.service.ts
 *
 * Servicio de chat entre usuario y ally durante una orden activa.
 * Base URL: EXPO_PUBLIC_API_URL + /chat
 *
 * Endpoints:
 *   POST /chat/orders/{order_id}/messages     — enviar mensaje
 *   GET  /chat/orders/{order_id}/messages     — obtener mensajes (polling)
 *   GET  /chat/orders/{order_id}/unread-count — badge de no leídos
 */

import apiClient from "@/api/client";
import type {
  ChatMessage,
  SendMessagePayload,
  UnreadCountResponse,
} from "@/types/chat.types";

export const chatService = {
  /**
   * Obtiene el historial de mensajes de la orden.
   * Si se pasa `since`, solo devuelve los mensajes posteriores a ese timestamp.
   * El parámetro `since` debe ser el `created_at` del último mensaje recibido.
   *
   * Efecto secundario: el backend marca como leídos los mensajes del otro
   * participante al hacer GET — no se necesita llamada extra.
   */
  async getMessages(orderId: string, since?: string): Promise<ChatMessage[]> {
    const params: Record<string, string | number> = { limit: 50 };
    if (since) params.since = since;

    const response = await apiClient.get<ChatMessage[]>(
      `/chat/orders/${orderId}/messages`,
      { params },
    );
    return response.data ?? [];
  },

  /**
   * Envía un nuevo mensaje en la conversación de la orden.
   * El backend determina el sender_role según el token del usuario.
   */
  async sendMessage(
    orderId: string,
    payload: SendMessagePayload,
  ): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>(
      `/chat/orders/${orderId}/messages`,
      payload,
    );
    return response.data;
  },

  /**
   * Devuelve el conteo de mensajes no leídos de la orden.
   * Útil para el badge sin traer el historial completo.
   */
  async getUnreadCount(orderId: string): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>(
      `/chat/orders/${orderId}/unread-count`,
    );
    return response.data.unread_count ?? 0;
  },
};
