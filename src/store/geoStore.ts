import { create } from "zustand";
import { District } from "@/types/geo.types";
import { geoService } from "@/api/services/geo.service";

interface GeoState {
  districts: District[];
  isLoading: boolean;
  error: string | null;

  fetchDistricts: () => Promise<void>;
  clearError: () => void;
}

export const useGeoStore = create<GeoState>((set) => ({
  districts: [],
  isLoading: false,
  error: null,

  fetchDistricts: async () => {
    try {
      set({ isLoading: true, error: null });
      const districts = await geoService.getDistricts();

      // Filtrar solo distritos activos y ordenar alfabéticamente
      const activeDistricts = districts
        .filter((d) => d.active)
        .sort((a, b) => a.name.localeCompare(b.name));

      set({ districts: activeDistricts, isLoading: false });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al cargar distritos";
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
