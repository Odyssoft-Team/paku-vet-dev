import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import { CommerceService } from "@/types/commerce.types";

export interface GetServicesParams {
  species: "dog" | "cat";
  breed?: string;
}

export const commerceService = {
  async getServices(params: GetServicesParams): Promise<CommerceService[]> {
    const response = await apiClient.get<CommerceService[]>(
      API_ENDPOINTS.COMMERCE.SERVICES,
      { params },
    );
    return response.data;
  },
};
