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
  console.log(
    "[createCulqiToken] publicKey:",
    publicKey ? `${publicKey.slice(0, 10)}...` : "VACÍA",
  );

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

  const rawText = await response.text();
  console.log("[createCulqiToken] status:", response.status);
  console.log("[createCulqiToken] body:", rawText);

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Respuesta inválida de Culqi: ${rawText.slice(0, 200)}`);
  }

  if (!response.ok) {
    // Culqi devuelve { object: "error", type, merchant_message, user_message }
    const culqiError = data as CulqiTokenError;
    throw new Error(culqiError.user_message || "Error al procesar la tarjeta.");
  }

  return data as CulqiToken;
}

// ─── Cliente HTTP para el microservicio de pagos (Culqi) ─────────────────────

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

  const fullUrl = `${PAYMENT_BASE}${path}`;
  console.log("[paymentFetch] →", fetchOptions.method || "GET", fullUrl);

  const response = await fetch(fullUrl, {
    ...fetchOptions,
    headers,
  });

  console.log("[paymentFetch] ← status:", response.status, response.statusText);

  const rawText = await response.text();
  console.log("[paymentFetch] ← body:", rawText.slice(0, 500));

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Respuesta no válida del servidor (${response.status}): ${rawText.slice(0, 200)}`,
    );
  }

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

// ─── Cliente HTTP para el backend principal de Paku (Bearer token) ────────────
// Usado para /wallet/cards — requiere el access token del usuario autenticado.

async function pakuFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { storage } = await import("@/utils/storage");
  const accessToken = await storage.getItem<string>(
    CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const fullUrl = `${CONFIG.API_URL}${path}`;
  console.log("[pakuFetch] →", options.method || "GET", fullUrl);

  const response = await fetch(fullUrl, { ...options, headers });

  console.log("[pakuFetch] ← status:", response.status);

  const rawText = await response.text();
  console.log("[pakuFetch] ← body:", rawText.slice(0, 300));

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Respuesta no válida del servidor (${response.status}): ${rawText.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    const detail = data?.detail;
    let message = `Error ${response.status}`;
    if (detail) {
      if (typeof detail === "string") message = detail;
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
   * Flujo completo para guardar una tarjeta:
   * 1. POST /api/culqi/cards  → tokeniza y guarda en Culqi
   * 2. POST /wallet/cards     → persiste en paku-backend para el wallet
   *
   * @param culqiCustomerId  ID del cliente Culqi (cus_test_xxx)
   * @param cardData         Datos de tarjeta a tokenizar
   */
  async saveCard(
    culqiCustomerId: string,
    cardData: CardData,
  ): Promise<SavedCard> {
    // Paso 1: tokenizar con Culqi directamente
    const token = await createCulqiToken(cardData);

    // Paso 2: guardar en Culqi via microservicio
    const culqiCard = await paymentFetch<SavedCard>("/api/culqi/cards", {
      method: "POST",
      body: JSON.stringify({
        customer_id: culqiCustomerId,
        token_id: token.id,
      }),
    });

    // Paso 3: persistir en paku-backend para mostrarlo en el wallet
    // Los datos de la tarjeta vienen en culqiCard.source (respuesta del microservicio)
    const cardSource = (culqiCard as any).source ?? {};
    const brand =
      cardSource.iin?.card_brand ?? culqiCard.card_brand ?? "Unknown";
    const last4 = cardSource.last_four ?? culqiCard.last_four ?? "";

    await pakuFetch("/wallet/cards", {
      method: "POST",
      body: JSON.stringify({
        provider: "culqi",
        payment_method_id: culqiCard.id,
        brand,
        last4,
        exp_month: 0, // Culqi no retorna vencimiento en la respuesta de cards
        exp_year: 0,
        culqi_customer_id: culqiCustomerId,
        culqi_card_id: culqiCard.id,
      }),
    });

    console.log(
      "[paymentService] Tarjeta guardada en Culqi y wallet:",
      culqiCard.id,
    );
    return culqiCard;
  },

  /**
   * GET /api/culqi/cards  (o el endpoint que liste las cards del usuario)
   * Lista las tarjetas guardadas del usuario autenticado.
   *
   * NOTA: Si el backend no expone este endpoint aún, ajustar la ruta.
   */
  /**
   * GET /wallet/cards  (backend principal de Paku)
   * Lista las tarjetas guardadas del usuario autenticado.
   * Requiere Bearer token — lo obtiene automáticamente del storage.
   */
  async listCards(): Promise<SavedCard[]> {
    return pakuFetch<SavedCard[]>("/wallet/cards");
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
