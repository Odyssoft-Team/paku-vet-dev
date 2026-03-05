import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useOrderStore } from "@/store/orderStore";
import { orderService } from "@/api/services/order.service";

const ACTIVE_STATUSES = ["on_the_way", "in_service"];
const POLL_INTERVAL = 10000;

/**
 * Hook que carga y mantiene actualizada la orden activa del usuario.
 * - Hace polling cada 10s SOLO si hay una orden activa.
 * - Pausa el polling cuando la app pasa a background (AppState).
 * - Se limpia correctamente al desmontar.
 */
export function useActiveOrder() {
  const { order, setOrder } = useOrderStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const loadActiveOrder = async () => {
    try {
      const orders = await orderService.getOrders();
      const active = orders.find((o) => ACTIVE_STATUSES.includes(o.status));
      setOrder(active ?? null);
    } catch (error) {
      console.log("Error cargando orden activa:", error);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) return; // ya está corriendo
    intervalRef.current = setInterval(loadActiveOrder, POLL_INTERVAL);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Pausar/reanudar polling según estado de la app
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        // App vuelve a primer plano — recargar y reanudar polling si aplica
        loadActiveOrder();
        if (order && ACTIVE_STATUSES.includes(order.status)) {
          startPolling();
        }
      } else if (nextState.match(/inactive|background/)) {
        // App va a background — pausar polling
        stopPolling();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [order]);

  // Iniciar/detener polling según si hay orden activa
  useEffect(() => {
    loadActiveOrder();

    if (order && ACTIVE_STATUSES.includes(order.status)) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [order?.id, order?.status]);

  return { order, loadActiveOrder };
}
