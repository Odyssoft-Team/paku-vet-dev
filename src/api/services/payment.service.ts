/**
 * payment.service.ts
 *
 * Servicio para el microservicio de Mercado Pago.
 * Base URL: https://stream.dev-qa.site/payment/api
 *
 * Usa su propio axios instance porque la base URL es diferente
 * al API principal de Paku.
 */

import axios from "axios";
import {
  SavedPaymentMethod,
  PaymentResponse,
  PaymentStatusResponse,
  SaveCardInput,
  PayInput,
} from "@/types/payment.types";

const PAYMENT_BASE_URL = "https://stream.dev-qa.site/payment/api";

// Token temporal para el microservicio de Mercado Pago.
// Este microservicio tiene su propio sistema de autenticación JWT
// independiente del backend principal de Paku.
// TODO: reemplazar cuando el backend unifique la autenticación.
const PAYMENT_SERVICE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwiZW1haWwiOiJxYUBsb2NhbC50ZXN0In0._oJS2BJJknCrOBnD_DsBwMjEJCyatbLVOr_yYB3Dgdw";

// Cliente axios dedicado al microservicio de pagos
const paymentClient = axios.create({
  baseURL: PAYMENT_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${PAYMENT_SERVICE_TOKEN}`,
  },
});

// ─── Métodos ───────────────────────────────────────────────────────────────────

export const paymentService = {
  /**
   * Lista las tarjetas guardadas del usuario autenticado.
   */
  async listCards(): Promise<SavedPaymentMethod[]> {
    const response =
      await paymentClient.get<SavedPaymentMethod[]>("/payment-methods");
    return response.data;
  },

  /**
   * Guarda una tarjeta tokenizada por el SDK de Mercado Pago.
   * @param card_token  Token generado por mp.createCardToken(...)
   */
  async saveCard(input: SaveCardInput): Promise<SavedPaymentMethod> {
    const response = await paymentClient.post<SavedPaymentMethod>(
      "/payment-methods",
      input,
    );
    return response.data;
  },

  /**
   * Inicia un pago — puede ser con tarjeta nueva o guardada.
   * Devuelve order_id + status (normalmente "PROCESSING").
   */
  async pay(input: PayInput): Promise<PaymentResponse> {
    const response = await paymentClient.post<PaymentResponse>(
      "/payments/pay",
      input,
    );
    return response.data;
  },

  /**
   * Consulta el estado de una orden de pago.
   * Llama hasta obtener PAID / FAILED / CANCELLED.
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    // Este endpoint no requiere Bearer según la doc, pero lo enviamos igual
    const response = await paymentClient.get<PaymentStatusResponse>(
      `/payments/${orderId}/status`,
    );
    return response.data;
  },

  /**
   * Polling: espera hasta que la orden tenga estado final.
   * Útil para mostrar el resultado después del pago.
   *
   * @param orderId   ID de la orden devuelta por pay()
   * @param maxWait   Tiempo máximo en ms (default 30s)
   * @param interval  Intervalo entre consultas en ms (default 2s)
   */
  async waitForFinalStatus(
    orderId: string,
    maxWait = 30_000,
    interval = 2_000,
  ): Promise<PaymentStatusResponse> {
    const FINAL_STATUSES = ["PAID", "FAILED", "CANCELLED"];
    const deadline = Date.now() + maxWait;

    while (Date.now() < deadline) {
      const result = await paymentService.getPaymentStatus(orderId);
      if (FINAL_STATUSES.includes(result.status)) {
        return result;
      }
      await new Promise((r) => setTimeout(r, interval));
    }

    // Si se agotó el tiempo, retornar el último estado conocido
    return paymentService.getPaymentStatus(orderId);
  },
};
