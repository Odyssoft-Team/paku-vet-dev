import { create } from 'zustand';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/types/auth.types';
import { authService } from '@/api/services/auth.service';
import { storage } from '@/utils/storage';
import { CONFIG } from '@/constants/config';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
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

      const response = await authService.login(credentials);

      // Guardar tokens y usuario en storage
      await storage.setItem(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        response.tokens.accessToken
      );
      await storage.setItem(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        response.tokens.refreshToken
      );
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, response.user);

      set({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al iniciar sesión';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authService.register(data);

      // Guardar tokens y usuario en storage
      await storage.setItem(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        response.tokens.accessToken
      );
      await storage.setItem(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        response.tokens.refreshToken
      );
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, response.user);

      set({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al registrarse';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Intentar cerrar sesión en el servidor
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
    } finally {
      // Limpiar storage y estado local
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
          tokens: { accessToken, refreshToken },
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user: User) => {
    set({ user });
    storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, user);
  },

  clearError: () => {
    set({ error: null });
  },
}));
