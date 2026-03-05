import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import {
  LoginCredentials,
  RegisterData,
  LoginResponse,
  RegisterResponse,
  SocialAuthResponse,
  CompleteProfileData,
  SocialAuthError,
  User,
} from "@/types/auth.types";

export const authService = {
  /**
   * Inicia sesión con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    return response.data;
  },

  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
    );
    return response.data;
  },

  /**
   * Refresca el token de acceso
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refresh_token: refreshToken },
    );
    return response.data;
  },

  /**
   * Obtiene información del usuario autenticado
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>(API_ENDPOINTS.USERS.ME);
    return response.data;
  },

  /**
   * Autenticación social (Google, Apple, Facebook)
   * Recibe el Firebase ID Token y lo valida en el backend Paku.
   * Endpoint público — sin Authorization header.
   */
  async socialLogin(idToken: string): Promise<SocialAuthResponse> {
    try {
      const response = await apiClient.post<SocialAuthResponse>(
        API_ENDPOINTS.AUTH.SOCIAL,
        { id_token: idToken },
        {
          // Este endpoint es público, no necesita token
          headers: { Authorization: undefined },
        },
      );
      return response.data;
    } catch (error: any) {
      // Error 409: email ya registrado con contraseña normal
      if (error.response?.status === 409) {
        const detail = error.response.data?.detail;
        throw new SocialAuthError(
          detail?.code ?? "EMAIL_ALREADY_REGISTERED",
          detail?.message ??
            "Este email ya está registrado. Inicia sesión con tu contraseña.",
        );
      }
      throw error;
    }
  },

  /**
   * Completa el perfil de un usuario social (PUT /users/me/complete).
   * Retorna NUEVOS tokens — siempre guardarlos para reemplazar los anteriores.
   */
  async completeProfile(data: CompleteProfileData): Promise<LoginResponse> {
    const response = await apiClient.put<LoginResponse>(
      API_ENDPOINTS.USERS.COMPLETE_PROFILE,
      data,
    );
    return response.data;
  },
};
