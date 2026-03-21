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
  isWaiting: boolean;
  isStale: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * ⚠️ Cambiar a false cuando el ally real esté enviando ubicaciones al backend.
 */
export const DEV_SIMULATE_GROOMER = true;

const POLL_INTERVAL_MS = 5000; // cada 5s — igual que la doc del backend
const SIM_DURATION_MS = 180000; // 3 minutos en total
const SIM_STEPS = SIM_DURATION_MS / POLL_INTERVAL_MS; // 36 pasos

// ─── Helpers de simulación ────────────────────────────────────────────────────

/** Punto de origen inventado ~1.5km al norte-oeste del destino */
function fakeOrigin(dest: LatLng): LatLng {
  return { lat: dest.lat + 0.013, lng: dest.lng - 0.011 };
}

/**
 * Genera N puntos interpolados con una curva suave para que
 * la ruta no sea una línea recta perfecta.
 */
function buildRoute(origin: LatLng, dest: LatLng, steps: number): LatLng[] {
  const points: LatLng[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    // Curva senoidal lateral para simular giro en una calle
    const curve = Math.sin(t * Math.PI) * 0.004;
    points.push({
      lat: origin.lat + (dest.lat - origin.lat) * t + curve,
      lng: origin.lng + (dest.lng - origin.lng) * t - curve * 0.6,
    });
  }
  return points;
}

/** ETA display basado en pasos restantes */
function etaFromSteps(stepsLeft: number): string {
  const sec = stepsLeft * (POLL_INTERVAL_MS / 1000);
  if (sec <= 15) return "Llegando...";
  if (sec < 60) return `${sec}s`;
  return `${Math.ceil(sec / 60)} min`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface Options {
  orderId: string | null;
  orderStatus: string;
  destination: LatLng | null;
  onSimulatedArrival?: () => void;
}

export function useAllyTracking({
  orderId,
  orderStatus,
  destination,
  onSimulatedArrival,
}: Options): AllyTrackingState {
  const [allyLocation, setAllyLocation] = useState<LatLng | null>(null);
  const [staleness, setStaleness] = useState<number | null>(null);
  const [etaDisplay, setEtaDisplay] = useState<string | null>(null);

  // Todos los valores mutables viven en refs para que el intervalo
  // siempre lea la versión más reciente sin recapturar closures.
  const stepRef = useRef(0);
  const routeRef = useRef<LatLng[]>([]);
  const destRef = useRef(destination);
  const arrivalCbRef = useRef(onSimulatedArrival);
  const orderIdRef = useRef(orderId);

  // Mantener refs sincronizados con props
  destRef.current = destination;
  arrivalCbRef.current = onSimulatedArrival;
  orderIdRef.current = orderId;

  const isActive = ["on_the_way", "in_service"].includes(orderStatus);

  useEffect(() => {
    if (!isActive || !orderId) {
      setAllyLocation(null);
      setStaleness(null);
      setEtaDisplay(null);
      return;
    }

    // Resetear estado de simulación al arrancar
    stepRef.current = 0;
    routeRef.current = [];

    // ── tick: lo que ocurre en cada intervalo ──────────────────────────────
    function tick() {
      if (DEV_SIMULATE_GROOMER) {
        tickSimulator();
      } else {
        tickReal();
      }
    }

    function tickSimulator() {
      const dest = destRef.current;
      if (!dest) return;

      // Construir la ruta la primera vez
      if (routeRef.current.length === 0) {
        const origin = fakeOrigin(dest);
        routeRef.current = buildRoute(origin, dest, SIM_STEPS);
        stepRef.current = 0;
      }

      const step = stepRef.current;
      const lastStep = routeRef.current.length - 1;

      // Si ya llegó al destino, quedarse en el último punto y no hacer nada más
      // El status lo cambia el backend — el front solo espera
      if (step >= routeRef.current.length) {
        setAllyLocation({ ...routeRef.current[lastStep] });
        setStaleness(2);
        setEtaDisplay("Llegando...");
        return;
      }

      const pos = routeRef.current[step];
      setAllyLocation({ ...pos });
      setStaleness(2);

      const stepsLeft = routeRef.current.length - step;
      setEtaDisplay(etaFromSteps(stepsLeft));

      stepRef.current += 1;
    }

    async function tickReal() {
      const id = orderIdRef.current;
      if (!id) return;
      try {
        const data = await trackingService.getCurrent(id);
        setStaleness(data.staleness_seconds);
        if (data.ally_location) {
          setAllyLocation({
            lat: data.ally_location.lat,
            lng: data.ally_location.lng,
          });
        }
      } catch (err) {
        console.warn("[Tracking] poll error:", err);
      }
    }

    // Primer tick inmediato para no esperar 5s
    tick();

    const interval = setInterval(tick, POLL_INTERVAL_MS);

    return () => clearInterval(interval);

    // Solo re-arrancar cuando cambie la orden o el status activo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isActive]);

  return {
    allyLocation,
    destination,
    orderStatus,
    staleness,
    etaDisplay,
    isWaiting: isActive && allyLocation === null,
    isStale: staleness !== null && staleness > 30,
  };
}
