import { SpaService } from "@/types/paku-spa.type";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const pakuSpaService = {
  /**
   * Obtiene todos los servicios de Paku SPA
   */
  async getSpaServices(): Promise<SpaService[]> {
    const response = await apiClient.get<SpaService[]>(API_ENDPOINTS.SPA.LIST);

    return response.data;
  },
};
