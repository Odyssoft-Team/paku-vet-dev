import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { UserProfile, UpdateProfileData } from '@/types/user.types';
import { ApiResponse } from '@/types/api.types';

export const userService = {
  /**
   * Obtiene el perfil del usuario
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>(
      API_ENDPOINTS.USERS.PROFILE
    );
    return response.data.data;
  },

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await apiClient.put<ApiResponse<UserProfile>>(
      API_ENDPOINTS.USERS.UPDATE_PROFILE,
      data
    );
    return response.data.data;
  },

  /**
   * Cambia la contraseña del usuario
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post(API_ENDPOINTS.USERS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
  },
};
