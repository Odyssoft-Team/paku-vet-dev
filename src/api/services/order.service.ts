import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import { Order, CreateOrderInput } from "@/types/order.types";

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>(API_ENDPOINTS.ORDERS.LIST);
    return response.data;
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await apiClient.post<Order>(
      API_ENDPOINTS.ORDERS.CREATE,
      input,
    );
    return response.data;
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(API_ENDPOINTS.ORDERS.BY_ID(id));
    return response.data;
  },

  /**
   * POST /orders/{id}/confirm-payment
   * Marca la orden como pagada tras un cargo exitoso de Culqi.
   */
  async confirmPayment(orderId: string, culqiChargeId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.ORDERS.CONFIRM_PAYMENT(orderId), {
      culqi_charge_id: culqiChargeId,
    });
  },

  /**
   * POST /orders/{id}/fail-payment
   * Marca la orden como fallida si el cargo fue rechazado.
   */
  async failPayment(orderId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.ORDERS.FAIL_PAYMENT(orderId));
  },

  /**
   * POST /orders/{id}/retry-payment
   * Resetea la orden a "pending" para reintentar el pago.
   */
  async retryPayment(orderId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.ORDERS.RETRY_PAYMENT(orderId));
  },
};
