import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import { CreateOrderInput, Order } from "@/types/order.types";

export const orderService = {
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await apiClient.post<Order>(
      API_ENDPOINTS.ORDERS.CREATE,
      input,
    );
    return response.data;
  },
};
