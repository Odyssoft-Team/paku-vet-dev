/**
 * useLocationReporter.ts
 *
 * Hook para que el groomer (ally) reporte su ubicación GPS al backend
 * mientras tiene una orden activa en estado on_the_way o in_service.
 *
 * - Solicita permisos de ubicación foreground
 * - Reporta cada 10 segundos via POST /tracking/orders/{id}/location
 * - Se activa/desactiva automáticamente según el estado de la orden
 * - Best-effort: los errores de red no interrumpen al groomer
 */

import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

// Estados en los que el groomer debe reportar su posición
const REPORTING_STATUSES = ["on_the_way", "in_service"];

// Intervalo de reporte según la doc del backend
const REPORT_INTERVAL_MS = 10_000; // 10 segundos

export function useLocationReporter(
  orderId: string | null,
  orderStatus: string,
) {
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const mountedRef = useRef(true);

  const active = !!orderId && REPORTING_STATUSES.includes(orderStatus);

  useEffect(() => {
    mountedRef.current = true;

    if (!active || !orderId) {
      // Detener el reporte si la orden ya no está activa
      subRef.current?.remove();
      subRef.current = null;
      return;
    }

    let started = false;

    const start = async () => {
      // Solicitar permiso de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("[LocationReporter] Permiso de ubicación denegado.");
        return;
      }

      if (!mountedRef.current) return;

      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: REPORT_INTERVAL_MS,
          distanceInterval: 5, // mínimo 5m de movimiento para reportar
        },
        async (loc) => {
          if (!mountedRef.current) return;
          try {
            await apiClient.post(
              API_ENDPOINTS.TRACKING.REPORT_LOCATION(orderId),
              {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                accuracy_m: loc.coords.accuracy ?? undefined,
              },
            );
          } catch (err: any) {
            // 409 = orden ya no activa — detener silenciosamente
            if (err?.response?.status === 409) {
              subRef.current?.remove();
              subRef.current = null;
            }
            // Cualquier otro error: best-effort, no interrumpir al groomer
          }
        },
      );
      started = true;
    };

    start();

    return () => {
      mountedRef.current = false;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [orderId, active]);
}
