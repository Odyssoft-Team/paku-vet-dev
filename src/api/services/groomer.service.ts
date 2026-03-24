import apiClient from "../client";
import { Order } from "@/types/order.types";

export const groomerService = {
  /**
   * Lista órdenes asignadas al ally autenticado.
   * GET /orders/my-assignments?status=in_service
   */
  async getMyAssignments(status?: string): Promise<Order[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<Order[]>("/orders/my-assignments", {
      params,
    });
    return response.data;
  },
};
