import apiClient from "../client";
import { Order, TypeStatus } from "@/types/order.types";

export const groomerService = {
  /**
   * Lista órdenes asignadas al ally autenticado.
   * Sin parámetro status → devuelve todas.
   * GET /orders/my-assignments?status=<status>
   */
  async getMyAssignments(status?: string): Promise<Order[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<Order[]>("/orders/my-assignments", {
      params,
    });
    return response.data;
  },

  /**
   * Cambia el estado de una orden.
   * POST /orders/{order_id}/status  { status }
   */
  async changeStatus(orderId: string, status: TypeStatus): Promise<void> {
    await apiClient.post(`/orders/${orderId}/status`, { status });
  },

  /**
   * Cancela una orden directamente.
   * POST /admin/orders/{order_id}/cancel
   */
  async cancelOrder(orderId: string): Promise<void> {
    await apiClient.post(`/admin/orders/${orderId}/cancel`);
  },
};
