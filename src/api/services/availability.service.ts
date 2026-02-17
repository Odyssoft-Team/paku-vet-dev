import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import {
  DayAvailability,
  GetAvailabilityParams,
} from "@/types/availability.types";

export const availabilityService = {
  /**
   * Obtiene la disponibilidad de un servicio
   */
  async getAvailability(
    params: GetAvailabilityParams,
  ): Promise<DayAvailability[]> {
    const response = await apiClient.get<DayAvailability[]>(
      API_ENDPOINTS.AVAILABILITY.GET,
      { params },
    );
    return response.data;
  },
};
