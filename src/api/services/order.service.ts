import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import { Order, CreateOrderInput } from "@/types/order.types";

export const orderService = {
  /**
   * Obtiene todas las ordenes del usuario
   */
  async getOrder(UserId: string): Promise<Order> {
    const response = await apiClient.get<Order>(
      API_ENDPOINTS.ORDERS.BY_USER(UserId),
    );
    return response.data;
  },

  /**
   * Crea ordenes
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await apiClient.post<Order>(
      API_ENDPOINTS.ORDERS.CREATE,
      input,
    );
    return response.data;
  },
};
