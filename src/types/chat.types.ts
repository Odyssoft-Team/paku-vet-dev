/**
 * chat.types.ts
 *
 * Tipos del módulo de chat entre usuario y ally durante una orden.
 */

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: "user" | "ally" | "admin";
  body: string;
  is_read: boolean;
  created_at: string; // ISO-8601
}

export interface SendMessagePayload {
  body: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}
