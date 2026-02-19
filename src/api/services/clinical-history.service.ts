import { ClinicalHistory } from "@/types/clinical-history.type";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const clinicalHistoryService = {
  /**
   * Obtiene el historial clínico filtrado por el ID de la mascota
   */
  async getHistoryByPet(petId: string): Promise<ClinicalHistory[]> {
    // Validamos que el petId no llegue vacío antes de disparar la petición
    if (!petId) throw new Error("El ID de la mascota es requerido");

    const response = await apiClient.get<ClinicalHistory[]>(
      API_ENDPOINTS.CLINICAL_HISTORY.BY_PET(petId),
    );

    return response.data;
  },
};
