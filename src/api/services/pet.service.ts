import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import { Pet, CreatePetData, GetPetsParams } from "@/types/pet.types";

export const petService = {
  /**
   * Obtiene todas las mascotas del usuario
   */
  async getPets(params?: GetPetsParams): Promise<Pet[]> {
    const response = await apiClient.get<Pet[]>(API_ENDPOINTS.PETS.LIST, {
      params: {
        limit: params?.limit || 10,
        offset: params?.offset || 0,
      },
    });
    return response.data;
  },

  /**
   * Crea una nueva mascota
   */
  async createPet(data: CreatePetData): Promise<Pet> {
    const response = await apiClient.post<Pet>(API_ENDPOINTS.PETS.CREATE, data);
    return response.data;
  },
};
