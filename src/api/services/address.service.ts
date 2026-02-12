import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import {
  Address,
  CreateAddressData,
  UpdateAddressData,
} from "@/types/address.types";

export const addressService = {
  /**
   * Obtiene todas las direcciones del usuario
   */
  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get<Address[]>(
      API_ENDPOINTS.ADDRESSES.LIST,
    );
    return response.data;
  },

  /**
   * Crea una nueva dirección
   */
  async createAddress(data: CreateAddressData): Promise<Address> {
    const response = await apiClient.post<Address>(
      API_ENDPOINTS.ADDRESSES.CREATE,
      data,
    );
    return response.data;
  },

  /**
   * Actualiza una dirección existente
   */
  async updateAddress(id: string, data: UpdateAddressData): Promise<Address> {
    const response = await apiClient.put<Address>(
      API_ENDPOINTS.ADDRESSES.UPDATE_DEFAULT(id),
      // data,
    );
    console.log("GAAAA:::", response.data);
    console.log("DATAAAAA:::", data);

    return response.data;
  },

  /**
   * Elimina una dirección
   */
  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADDRESSES.DELETE(id));
  },
};
