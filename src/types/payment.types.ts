// ─── Tarjetas guardadas ────────────────────────────────────────────────────────

export interface SavedPaymentMethod {
  id: string; // UUID interno del backend
  brand: string; // "visa" | "master" | "amex" | ...
  last4: string;
  exp_month: number;
  exp_year: number;
  // campos extra que mapea el index2.html desde la API
  mp_card_id?: string;
}

// ─── Pago ──────────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export interface PaymentResponse {
  order_id: string;
  status: PaymentStatus;
}

export interface PaymentStatusResponse {
  order_id: string;
  status: PaymentStatus;
}

// ─── Inputs al backend ─────────────────────────────────────────────────────────

export interface SaveCardInput {
  card_token: string; // token generado por MP SDK
}

/** Pago con tarjeta nueva (no guardada) */
export interface PayWithNewCardInput {
  cart_id: string;
  amount: number; // en centimos (ej: 1500 = S/15.00)
  currency: string;
  card_token: string;
  payment_method_id: string; // "visa" | "master" | ...
  installments: number;
  save_card?: boolean;
}

/** Pago con tarjeta guardada */
export interface PayWithSavedCardInput {
  cart_id: string;
  amount: number;
  currency: string;
  saved_payment_method_id: string;
  card_token: string; // sigue siendo necesario (CVV re-tokenizado)
  installments: number;
}

export type PayInput = PayWithNewCardInput | PayWithSavedCardInput;
