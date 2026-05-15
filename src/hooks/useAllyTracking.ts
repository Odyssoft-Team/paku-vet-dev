/**
 * useAllyTracking.ts
 *
 * Hook de tracking en tiempo real del ally (groomer).
 *
 * Dos intervalos separados según la doc:
 *   - GET /current cada 10s  → posición del marcador (barato)
 *   - GET /route   cada 30s  → polyline + ETA (tiene costo en Google Routes)
 *
 * Expone `polyline` (encoded string) para que tracking-service.tsx
 * lo decodifique y lo dibuje con el componente Polyline de react-native-maps.
 */

import { useState, useEffect, useRef } from "react";
import { trackingService } from "@/api/services/tracking.service";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AllyTrackingState {
  allyLocation: LatLng | null;
  destination: LatLng | null;
  orderStatus: string;
  staleness: number | null;
  etaDisplay: string | null;
  polyline: string | null; // encoded polyline de Google — decodificar en el mapa
  isWaiting: boolean;
  isStale: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_CURRENT_MS = 10_000; // cada 10s — posición del marcador
const POLL_ROUTE_MS = 30_000; // cada 30s — polyline + ETA (costo Google Routes)

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface Options {
  orderId: string | null;
  orderStatus: string;
  destination: LatLng | null;
  onSimulatedArrival?: () => void; // mantenido por compatibilidad con tracking-service.tsx
}

export function useAllyTracking({
  orderId,
  orderStatus,
}: Options): AllyTrackingState {
  const [allyLocation, setAllyLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [staleness, setStaleness] = useState<number | null>(null);
  const [etaDisplay, setEtaDisplay] = useState<string | null>(null);
  const [polyline, setPolyline] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const currentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const routeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive = ["on_the_way", "in_service"].includes(orderStatus);

  // ─── Fetch posición actual ─────────────────────────────────────────────────

  const fetchCurrent = async () => {
    if (!orderId || cancelledRef.current) return;
    try {
      const data = await trackingService.getCurrent(orderId);
      if (cancelledRef.current) return;

      setStaleness(data.staleness_seconds);

      if (data.ally_location) {
        setAllyLocation({
          lat: data.ally_location.lat,
          lng: data.ally_location.lng,
        });
      }

      if (data.destination) {
        setDestination({
          lat: data.destination.lat,
          lng: data.destination.lng,
        });
      }

      // Si el backend reporta que la orden ya no está activa — limpiar
      if (!["on_the_way", "in_service"].includes(data.order_status)) {
        setAllyLocation(null);
        setEtaDisplay(null);
        setPolyline(null);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      // 409 = orden no activa — silencioso
      if (status !== 409) {
        console.warn("[Tracking] getCurrent error:", err?.message);
      }
    }
  };

  // ─── Fetch ruta + ETA ──────────────────────────────────────────────────────

  const fetchRoute = async () => {
    if (!orderId || cancelledRef.current) return;
    try {
      const data = await trackingService.getRoute(orderId);
      if (cancelledRef.current || !data) return;

      if (data.eta_display) setEtaDisplay(data.eta_display);
      if (data.polyline) setPolyline(data.polyline);
    } catch {
      // silencioso — mantener polyline y ETA anteriores
    }
  };

  // ─── Efecto principal ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isActive || !orderId) {
      setAllyLocation(null);
      setStaleness(null);
      setEtaDisplay(null);
      setPolyline(null);
      return;
    }

    cancelledRef.current = false;

    // Primera carga inmediata
    fetchCurrent();
    fetchRoute();

    // Intervalo posición: cada 10s
    currentIntervalRef.current = setInterval(fetchCurrent, POLL_CURRENT_MS);

    // Intervalo ruta: cada 30s
    routeIntervalRef.current = setInterval(fetchRoute, POLL_ROUTE_MS);

    return () => {
      cancelledRef.current = true;
      if (currentIntervalRef.current) clearInterval(currentIntervalRef.current);
      if (routeIntervalRef.current) clearInterval(routeIntervalRef.current);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isActive]);

  return {
    allyLocation,
    destination,
    orderStatus,
    staleness,
    etaDisplay,
    polyline,
    isWaiting: isActive && allyLocation === null,
    isStale: staleness !== null && staleness > 30,
  };
}
