import { create } from "zustand";
import { Pet, CreatePetData, GetPetsParams } from "@/types/pet.types";
import { petService } from "@/api/services/pet.service";

interface PetState {
  pets: Pet[];
  isLoading: boolean;
  error: string | null;

  fetchPets: (params?: GetPetsParams) => Promise<void>;
  createPet: (data: CreatePetData) => Promise<Pet>;
  clearError: () => void;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  isLoading: false,
  error: null,

  fetchPets: async (params?: GetPetsParams) => {
    try {
      set({ isLoading: true, error: null });
      const pets = await petService.getPets(params);
      set({ pets, isLoading: false });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al cargar mascotas";
      set({ error: errorMessage, isLoading: false });
    }
  },

  createPet: async (data: CreatePetData) => {
    try {
      set({ isLoading: true, error: null });
      const newPet = await petService.createPet(data);

      const { pets } = get();
      set({
        pets: [newPet, ...pets],
        isLoading: false,
      });

      return newPet;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al crear mascota";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
