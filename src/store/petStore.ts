import { create } from "zustand";
import { Pet, CreatePetData, GetPetsParams } from "@/types/pet.types";
import { petService } from "@/api/services/pet.service";
import { mediaService } from "@/api/services/media.service";

interface PetState {
  pets: Pet[];
  isLoading: boolean;
  error: string | null;

  fetchPets: (params?: GetPetsParams) => Promise<void>;
  createPet: (data: CreatePetData) => Promise<Pet>;
  updatePetPhoto: (petId: string, readUrl: string) => void;
  clearError: () => void;
}

// Convierte el object_name de una mascota en una signed read URL.
async function resolvePhotoUrl(pet: Pet): Promise<Pet> {
  if (!pet.photo_url) return pet;
  try {
    const readUrl = await mediaService.getSignedReadUrl(pet.photo_url);
    return { ...pet, photo_url: readUrl };
  } catch {
    return pet;
  }
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  isLoading: false,
  error: null,

  fetchPets: async (params?: GetPetsParams) => {
    try {
      set({ isLoading: true, error: null });
      const pets = await petService.getPets(params);

      // Resolver signed read URLs en paralelo para todas las mascotas
      const petsWithPhotos = await Promise.all(pets.map(resolvePhotoUrl));

      set({ pets: petsWithPhotos, isLoading: false });
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

  // Actualiza el photo_url de una mascota en el store con la signed read URL
  updatePetPhoto: (petId: string, readUrl: string) => {
    const { pets } = get();
    set({
      pets: pets.map((p) =>
        p.id === petId ? { ...p, photo_url: readUrl } : p,
      ),
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
