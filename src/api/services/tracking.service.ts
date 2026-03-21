import { CONFIG } from "@/constants/config";
import { storage } from "@/utils/storage";
import { API_ENDPOINTS } from "../endpoints";
import { TrackingCurrent, TrackingRoute } from "@/types/tracking.type";

// ── Helper fetch con base URL propia (sin /paku/api/v1) ───────────────────────

async function trackingFetch<T>(path: string): Promise<T> {
  const token = await storage.getItem<string>(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  // La doc dice base URL sin prefijo — usamos MEDIA_API_URL que ya apunta al dominio raíz
  // Extraemos el dominio base quitando el prefijo /paku/api/v1
  const baseUrl = CONFIG.MEDIA_API_URL.replace(/\/paku\/api\/v1$/, "");
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(`Tracking fetch failed: ${response.status}`),
      {
        response: { status: response.status, data: err },
      },
    );
  }

  return response.json();
}

// ── Servicio ─────────────────────────────────────────────────────────────────

export const trackingService = {
  /**
   * Última posición conocida del ally para una orden activa.
   * Disponible cuando status = on_the_way | in_service
   */
  async getCurrent(orderId: string): Promise<TrackingCurrent> {
    return trackingFetch<TrackingCurrent>(
      API_ENDPOINTS.TRACKING.CURRENT(orderId),
    );
  },

  /**
   * Ruta y ETA calculados por Google Routes.
   * Puede devolver 501 si Google Routes no está configurado — tratar como opcional.
   */
  async getRoute(orderId: string): Promise<TrackingRoute | null> {
    try {
      return await trackingFetch<TrackingRoute>(
        API_ENDPOINTS.TRACKING.ROUTE(orderId),
      );
    } catch (err: any) {
      if (err?.response?.status === 501 || err?.response?.status === 502) {
        return null; // Google Routes no configurado — degradar gracefully
      }
      throw err;
    }
  },
};
