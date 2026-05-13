/**
 * payment.types.ts
 *
 * Tipos del dominio de pagos — Culqi
 * Reemplaza la integración anterior de Mercado Pago.
 */

// ─── Token de Culqi (respuesta de secure.culqi.com/v2/tokens) ────────────────

export interface CulqiToken {
  id: string; // "tkn_test_xxx" o "tkn_live_xxx" — se envía al backend
  object: string;
  email: string;
  last_four: string;
  card_brand: string; // "Visa", "Mastercard", "Amex", ...
}

export interface CulqiTokenError {
  object: "error";
  type: string;
  merchant_message: string;
  user_message: string;
  code?: string;
}

// ─── Datos de tarjeta (solo para tokenización directa con Culqi) ─────────────
// Estos datos NUNCA llegan al backend propio — van directo a Culqi.

export interface CardData {
  card_number: string; // Sin espacios ni guiones
  cvv: string;
  expiration_month: string; // "01" – "12"
  expiration_year: string; // "2026", "2027"...
  email: string;
}

// ─── Tarjetas guardadas (respuesta del backend) ───────────────────────────────

export interface SavedCard {
  id: string; // crd_test_xxx — ID de tarjeta en Culqi
  object: "card";
  last_four: string;
  card_brand: string; // "Visa", "Mastercard", "Amex", "Diners", ...
  card_type: string; // "credito" | "debito"
  customer_id: string; // cus_test_xxx
}

// Alias para compatibilidad con los componentes de cart.tsx y useSavedCards.ts
// Mapea los campos de Culqi a los nombres que usa la UI existente.
export interface SavedPaymentMethod {
  id: string; // = SavedCard.id (crd_test_xxx)
  brand: string; // = SavedCard.card_brand (normalizado a minúsculas)
  last4: string; // = SavedCard.last_four
  exp_month: number; // No disponible en Culqi cards — usar 0 como fallback
  exp_year: number; // No disponible en Culqi cards — usar 0 como fallback
}

/** Convierte SavedCard de Culqi al formato interno que usa la UI */
export function toSavedPaymentMethod(card: SavedCard): SavedPaymentMethod {
  return {
    id: card.id,
    brand: card.card_brand.toLowerCase(),
    last4: card.last_four,
    exp_month: 0, // Culqi no retorna fecha de vencimiento en GET /cards
    exp_year: 0,
  };
}

// ─── Cliente Culqi (respuesta del backend) ────────────────────────────────────

export interface CulqiCustomer {
  id: string; // cus_test_xxx — guardar en BD para cobros futuros
  object: "customer";
  first_name: string;
  last_name: string;
  email: string;
}

// ─── Cargo (respuesta de POST /api/culqi/charges) ─────────────────────────────

export interface CulqiCharge {
  id: string; // chr_test_xxx
  object: "charge";
  amount: number;
  currency_code: string;
  email: string;
  source_id: string;
  outcome: { type: string; merchant_message: string };
  duplicated: boolean;
  culqi_tracking_id?: string;
}

// ─── Payloads hacia el backend ────────────────────────────────────────────────

export interface CreateCustomerPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  address_city: string;
  country_code: string;
}

export interface SaveCardPayload {
  customer_id: string; // cus_test_xxx del cliente Culqi
  token_id: string; // tkn_test_xxx generado por createCulqiToken()
}

export interface CreateChargePayload {
  amount: number; // En céntimos: 1000 = S/10.00
  currency_code: "PEN" | "USD";
  email: string;
  source_id: string; // tkn_... (nueva) | crd_... (guardada)
  description?: string;
  metadata?: Record<string, string>;
  antifraud_details?: AntifraudDetails;
}

export interface AntifraudDetails {
  first_name: string;
  last_name: string;
  address: string;
  address_city: string;
  country_code: string;
  phone_number: string;
}

// ─── Errores de negocio ────────────────────────────────────────────────────────

export type PaymentErrorCode =
  | "card_declined"
  | "insufficient_funds"
  | "expired_card"
  | "incorrect_cvv"
  | "processing_error"
  | "fraud_detected"
  | "network_error";
