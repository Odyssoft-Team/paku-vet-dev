import { create } from "zustand";
import {
  DayAvailability,
  GetAvailabilityParams,
} from "@/types/availability.types";
import { availabilityService } from "@/api/services/availability.service";

interface AvailabilityState {
  availability: DayAvailability[];
  isLoading: boolean;
  error: string | null;

  fetchAvailability: (params: GetAvailabilityParams) => Promise<void>;
  clearError: () => void;
  clearAvailability: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  availability: [],
  isLoading: false,
  error: null,

  fetchAvailability: async (params: GetAvailabilityParams) => {
    try {
      set({ isLoading: true, error: null });
      const availability = await availabilityService.getAvailability(params);
      set({ availability, isLoading: false });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al cargar disponibilidad";
      console.error("Error fetching availability:", error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearAvailability: () => {
    set({ availability: [], error: null });
  },
}));
