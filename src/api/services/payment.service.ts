/**
 * payment.service.ts
 *
 * Servicio de pagos — Culqi
 *
 * Reemplaza la integración anterior de Mercado Pago.
 *
 * Arquitectura:
 *   1. createCulqiToken()  → llama directo a secure.culqi.com (con public key)
 *                            los datos de tarjeta NUNCA tocan el backend propio.
 *   2. paymentService.*    → llama al microservicio propio (con X-API-Key)
 *                            solo recibe token_id / card_id, nunca datos raw.
 */

import { CONFIG } from "@/constants/config";
import type {
  CulqiToken,
  CulqiTokenError,
  CardData,
  SavedCard,
  CulqiCustomer,
  CulqiCharge,
  CreateCustomerPayload,
  SaveCardPayload,
  CreateChargePayload,
} from "@/types/payment.types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const CULQI_TOKEN_URL = "https://secure.culqi.com/v2/tokens";
const PAYMENT_BASE = CONFIG.PAYMENT_API_URL; // ej: "https://stream.dev-qa.site/payment"

// ─── Tokenización directa con Culqi ──────────────────────────────────────────

/**
 * Tokeniza los datos de tarjeta enviándolos DIRECTAMENTE a Culqi.
 * El backend propio nunca recibe PAN ni CVV.
 * El token resultante expira en 5 minutos.
 */
export async function createCulqiToken(card: CardData): Promise<CulqiToken> {
  const publicKey = CONFIG.CULQI_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("EXPO_PUBLIC_CULQI_PUBLIC_KEY no está configurada.");
  }

  const response = await fetch(CULQI_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicKey}`,
    },
    body: JSON.stringify({
      card_number: card.card_number.replace(/\s/g, ""),
      cvv: card.cvv,
      expiration_month: card.expiration_month,
      expiration_year: card.expiration_year,
      email: card.email,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Culqi devuelve { object: "error", type, merchant_message, user_message }
    const culqiError = data as CulqiTokenError;
    throw new Error(culqiError.user_message || "Error al procesar la tarjeta.");
  }

  return data as CulqiToken;
}

// ─── Cliente HTTP para el microservicio de pagos ──────────────────────────────

async function paymentFetch<T>(
  path: string,
  options: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const apiKey = CONFIG.PAYMENT_API_KEY;
  const { idempotencyKey, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-API-Key": apiKey } : {}),
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(`${PAYMENT_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const detail = data?.detail;
    let message = `Error ${response.status}`;
    if (detail) {
      if (typeof detail === "string") message = detail;
      else if (detail.user_message) message = detail.user_message;
      else if (detail.merchant_message) message = detail.merchant_message;
      else if (detail.message) message = detail.message;
    }
    throw new Error(message);
  }

  return data as T;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Genera un UUID v4 simple sin dependencias externas */
function generateIdempotencyKey(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Servicio de pagos ────────────────────────────────────────────────────────

export const paymentService = {
  /**
   * Tokeniza una tarjeta directamente con Culqi.
   * Wrapper de createCulqiToken para uso desde componentes.
   */
  createToken: createCulqiToken,

  /**
   * POST /api/culqi/customers
   * Crea un cliente en Culqi. Se hace una sola vez por usuario.
   * Guardar el customer.id en el backend o perfil del usuario.
   */
  async createCustomer(payload: CreateCustomerPayload): Promise<CulqiCustomer> {
    return paymentFetch<CulqiCustomer>("/api/culqi/customers", {
      method: "POST",
      body: JSON.stringify({ ...payload, country_code: "PE" }),
    });
  },

  /**
   * POST /api/culqi/cards
   * Guarda una tarjeta tokenizada asociada al cliente Culqi.
   * Requiere haber creado el cliente previamente.
   *
   * @param culqiCustomerId  ID del cliente en Culqi (cus_test_xxx)
   * @param cardData         Datos de tarjeta a tokenizar y guardar
   */
  async saveCard(
    culqiCustomerId: string,
    cardData: CardData,
  ): Promise<SavedCard> {
    // Primero tokenizar con Culqi directamente
    const token = await createCulqiToken(cardData);

    const payload: SaveCardPayload = {
      customer_id: culqiCustomerId,
      token_id: token.id,
    };

    return paymentFetch<SavedCard>("/api/culqi/cards", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /api/culqi/cards  (o el endpoint que liste las cards del usuario)
   * Lista las tarjetas guardadas del usuario autenticado.
   *
   * NOTA: Si el backend no expone este endpoint aún, ajustar la ruta.
   */
  async listCards(): Promise<SavedCard[]> {
    return paymentFetch<SavedCard[]>("/api/culqi/cards");
  },

  /**
   * POST /api/culqi/charges
   * Cobra con tarjeta nueva (token) o guardada (card id).
   *
   * Para tarjeta nueva: source_id = tkn_test_xxx
   * Para tarjeta guardada: source_id = crd_test_xxx
   *
   * El Idempotency-Key se genera automáticamente por cada llamada.
   */
  async charge(payload: CreateChargePayload): Promise<CulqiCharge> {
    return paymentFetch<CulqiCharge>("/api/culqi/charges", {
      method: "POST",
      body: JSON.stringify(payload),
      idempotencyKey: generateIdempotencyKey(),
    });
  },

  /**
   * Flujo completo: tokenizar tarjeta nueva y cobrarla en un solo paso.
   * Equivalente a chargeCard() de la documentación.
   */
  async chargeNewCard(params: {
    card: CardData;
    amount: number;
    currency?: "PEN" | "USD";
    description?: string;
  }): Promise<CulqiCharge> {
    const token = await createCulqiToken(params.card);

    return paymentService.charge({
      amount: params.amount,
      currency_code: params.currency ?? "PEN",
      email: params.card.email,
      source_id: token.id,
      description: params.description,
    });
  },

  /**
   * Flujo completo: cobrar con tarjeta guardada.
   * source_id = crd_test_xxx (ID de la tarjeta guardada en Culqi)
   */
  async chargeSavedCard(params: {
    culqiCardId: string;
    email: string;
    amount: number;
    currency?: "PEN" | "USD";
    description?: string;
  }): Promise<CulqiCharge> {
    return paymentService.charge({
      amount: params.amount,
      currency_code: params.currency ?? "PEN",
      email: params.email,
      source_id: params.culqiCardId,
      description: params.description,
    });
  },
};

// ─── Mensajes de error amigables ──────────────────────────────────────────────

const DECLINE_MESSAGES: Record<string, string> = {
  insufficient_funds: "Tu tarjeta no tiene fondos suficientes.",
  card_declined: "Tu tarjeta fue rechazada. Contacta a tu banco.",
  expired_card: "Tu tarjeta está vencida.",
  incorrect_cvv: "El código de seguridad (CVV) es incorrecto.",
  processing_error: "Error al procesar el pago. Intenta nuevamente.",
  fraud_detected:
    "Tu banco bloqueó el pago por seguridad. Contacta a tu banco.",
};

export function getPaymentErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || "No se pudo procesar el pago. Intenta nuevamente.";
  }
  return "Ocurrió un error inesperado.";
}

export function getDeclineMessage(declineCode: string): string {
  return (
    DECLINE_MESSAGES[declineCode] ||
    "No se pudo procesar el pago. Intenta nuevamente."
  );
}
