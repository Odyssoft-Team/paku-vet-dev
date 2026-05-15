/**
 * tracking.service.ts
 *
 * Servicio de tracking del ally (groomer) en tiempo real.
 * Base URL: EXPO_PUBLIC_API_URL + /tracking/...
 *
 * Usa apiClient (axios) con auth interceptor automático —
 * igual que el resto de servicios de la app.
 */

import apiClient from "@/api/client";
import { API_ENDPOINTS } from "../endpoints";
import type { TrackingCurrent, TrackingRoute } from "@/types/tracking.type";

export const trackingService = {
  /**
   * GET /tracking/orders/{order_id}/current
   * Última posición conocida del ally + coordenadas del destino.
   * Hacer polling cada 10 segundos. Disponible en on_the_way e in_service.
   *
   * Si ally_location es null, el ally aún no reportó su primera posición.
   * staleness_seconds > 30 → mostrar aviso "Actualizando ubicación..."
   */
  async getCurrent(orderId: string): Promise<TrackingCurrent> {
    const response = await apiClient.get<TrackingCurrent>(
      API_ENDPOINTS.TRACKING.CURRENT(orderId),
    );
    return response.data;
  },

  /**
   * GET /tracking/orders/{order_id}/route
   * Polyline dibujable + ETA calculado por Google Routes API.
   *
   * ⚠️ Tiene costo por llamada — usar cada 30s, NO cada 10s.
   *
   * Retorna null en estos casos (degradar gracefully):
   *   - 501: Google Routes API no configurada en el servidor
   *   - 502: Google Routes falló — mantener polyline anterior
   *   - ally_location null: no hay origen todavía
   */
  async getRoute(orderId: string): Promise<TrackingRoute | null> {
    try {
      const response = await apiClient.get<TrackingRoute>(
        API_ENDPOINTS.TRACKING.ROUTE(orderId),
      );
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 501 || status === 502 || status === 409) {
        return null; // degradar silenciosamente
      }
      throw err;
    }
  },
};
