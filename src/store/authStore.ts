import { create } from "zustand";
import {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  CompleteProfileData,
} from "@/types/auth.types";
import { authService } from "@/api/services/auth.service";
import { storage } from "@/utils/storage";
import { CONFIG } from "@/constants/config";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  /** Login con Google: Firebase ID Token → backend /auth/social */
  socialLogin: (idToken: string) => Promise<{ is_new_user: boolean }>;
  /** Completa perfil usuario social — actualiza tokens nuevos */
  completeProfile: (data: CompleteProfileData) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });
      const loginResponse = await authService.login(credentials);

      await storage.setItem(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        loginResponse.access_token,
      );
      await storage.setItem(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        loginResponse.refresh_token,
      );

      const user = await authService.getCurrentUser();
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, user);

      set({
        user,
        tokens: {
          access_token: loginResponse.access_token,
          refresh_token: loginResponse.refresh_token,
          token_type: loginResponse.token_type,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.log("Login error in store:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Error al iniciar sesión";
      set({ error: errorMessage, isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });
      const user = await authService.register(data);
      const loginResponse = await authService.login({
        email: data.email,
        password: data.password,
      });

      await storage.setItem(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        loginResponse.access_token,
      );
      await storage.setItem(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        loginResponse.refresh_token,
      );
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, user);

      set({
        user,
        tokens: {
          access_token: loginResponse.access_token,
          refresh_token: loginResponse.refresh_token,
          token_type: loginResponse.token_type,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Error al registrarse";
      set({ error: errorMessage, isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  socialLogin: async (idToken: string) => {
    try {
      set({ isLoading: true, error: null });

      const socialResponse = await authService.socialLogin(idToken);

      await storage.setItem(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        socialResponse.access_token,
      );
      await storage.setItem(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        socialResponse.refresh_token,
      );

      const user = await authService.getCurrentUser();
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, user);

      set({
        user,
        tokens: {
          access_token: socialResponse.access_token,
          refresh_token: socialResponse.refresh_token,
          token_type: socialResponse.token_type,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      return { is_new_user: socialResponse.is_new_user };
    } catch (error: any) {
      set({ isLoading: false });
      throw error; // Re-lanzar para que la pantalla maneje EMAIL_ALREADY_REGISTERED, etc.
    }
  },

  completeProfile: async (data: CompleteProfileData) => {
    try {
      set({ isLoading: true, error: null });

      // ⚠️ El backend retorna NUEVOS tokens con profile_completed: true
      const newTokens = await authService.completeProfile(data);

      await storage.setItem(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        newTokens.access_token,
      );
      await storage.setItem(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        newTokens.refresh_token,
      );

      const user = await authService.getCurrentUser();
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, user);

      set({
        user,
        tokens: {
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          token_type: newTokens.token_type,
        },
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Error al completar el perfil";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await storage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      await storage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      await storage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.log("Error al cerrar sesión:", error);
    }
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });
      const [accessToken, refreshToken, userData] = await Promise.all([
        storage.getItem<string>(CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
        storage.getItem<string>(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
        storage.getItem<User>(CONFIG.STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && refreshToken && userData) {
        set({
          user: userData,
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "bearer",
          },
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.log("Error loading stored auth:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user: User) => {
    set({ user });
    storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, user);
  },

  clearError: () => set({ error: null }),
}));
