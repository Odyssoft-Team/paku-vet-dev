/**
 * pet-records.service.ts
 *
 * Servicio de registros de mascotas — módulo pet_records.
 * Usa el apiClient (axios) ya configurado con auth interceptor.
 * Endpoint base: /pets/{pet_id}/records
 */

import apiClient from "@/api/client";
import type {
  PetRecordOut,
  CreatePetRecordPayload,
  ListRecordsParams,
} from "@/types/pet-record.types";

export const petRecordsService = {
  /**
   * GET /pets/{pet_id}/records
   * Lista los registros de una mascota con filtros opcionales.
   * Devuelve [] si el backend responde 404 (sin registros aún).
   */
  async list(
    petId: string,
    params: ListRecordsParams = {},
  ): Promise<PetRecordOut[]> {
    const response = await apiClient.get<PetRecordOut[]>(
      `/pets/${petId}/records`,
      { params: { limit: 50, offset: 0, ...params } },
    );
    return response.data ?? [];
  },

  /**
   * GET /pets/{pet_id}/records/{record_id}
   * Obtiene un registro específico.
   */
  async getOne(petId: string, recordId: string): Promise<PetRecordOut> {
    const response = await apiClient.get<PetRecordOut>(
      `/pets/${petId}/records/${recordId}`,
    );
    return response.data;
  },

  /**
   * POST /pets/{pet_id}/records
   * Crea un nuevo registro.
   * El campo `title` es opcional — el backend lo autogenera si es null.
   */
  async create(
    petId: string,
    payload: CreatePetRecordPayload,
  ): Promise<PetRecordOut> {
    const response = await apiClient.post<PetRecordOut>(
      `/pets/${petId}/records`,
      {
        ...payload,
        title: payload.title ?? null,
        attachment_ids: payload.attachment_ids ?? [],
      },
    );
    return response.data;
  },
};
