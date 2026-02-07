import { create } from "zustand";
import {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
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

      console.log("Calling login API...");
      const loginResponse = await authService.login(credentials);
      console.log("login response::", loginResponse);

      // Guardar tokens
      await storage.setItem(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        loginResponse.access_token,
      );
      await storage.setItem(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        loginResponse.refresh_token,
      );

      console.log("Fetching user data...");
      const user = await authService.getCurrentUser();
      console.log("User data:", user);

      // Guardar usuario
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, user);

      console.log("Setting auth state...");
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

      console.log("Auth state updated successfully");
    } catch (error: any) {
      console.error("Login error in store:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Error al iniciar sesión";
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

      // Registrar usuario
      const user = await authService.register(data);

      // Hacer login automáticamente después del registro
      const loginResponse = await authService.login({
        email: data.email,
        password: data.password,
      });

      // Guardar tokens
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
      console.error("Error al cerrar sesión:", error);
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
      console.error("Error loading stored auth:", error);
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
