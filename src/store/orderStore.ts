import { Order } from "@/types/order.types";
import { create } from "zustand";

interface OrderState {
  // Ahora manejamos la orden actual, puede ser null si no hay ninguna cargada
  order: Order | null;
  isLoading: boolean;

  // Acciones
  setOrder: (order: Order | null) => void;
  updateStatus: (status: Order["status"]) => void;
  clearOrder: () => void;
  setLoading: (loading: boolean) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  order: null,
  isLoading: false,

  // Guardar la orden recibida de la API
  setOrder: (order) => set({ order, isLoading: false }),

  // Actualizar solo el estado (útil para cambios rápidos de UI)
  updateStatus: (status) =>
    set((state) => ({
      order: state.order ? { ...state.order, status } : null,
    })),

  // Resetear el estado
  clearOrder: () => set({ order: null, isLoading: false }),

  // Controlar el estado de carga
  setLoading: (loading) => set({ isLoading: loading }),
}));
