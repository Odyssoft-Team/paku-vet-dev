import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { CONFIG } from "@/constants/config";
import { storage } from "@/utils/storage";
import { LoginResponse } from "@/types/auth.types";

const apiClient: AxiosInstance = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de request
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/login-form") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/refresh") ||
      config.url?.includes("/auth/social");

    // DENTRO DEL INTERCEPTOR DE REQUEST
    if (!isAuthEndpoint) {
      const accessToken = await storage.getItem<string>(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
      );

      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else {
        console.log(
          "⚠️ ALERTA: Enviando petición sin Token a endpoint protegido",
        );
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const forceLogout = async () => {
  await storage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  await storage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  await storage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);

  // Import dinámico para evitar dependencia circular con authStore
  const { useAuthStore } = await import("@/store/authStore");
  useAuthStore.setState({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Navegar al login
  const { router } = await import("expo-router");
  router.replace("/(auth)/login");
};

// Interceptor de response
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    console.log("Response error:", error.message); // Log
    console.log("Error details:", error.response?.data); // Log
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // No intentar refresh en endpoints de auth,
    // pero SÍ hacer forceLogout si el refresh token expiró
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/login-form") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/social");

    const isRefreshEndpoint = originalRequest.url?.includes("/auth/refresh");

    if (isRefreshEndpoint) {
      // El refresh token expiró o es inválido → logout forzado
      if (error.response?.status === 401) {
        processQueue(error as unknown as Error, null);
        isRefreshing = false;
        await forceLogout();
      }
      return Promise.reject(error);
    }

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Guard: perfil incompleto (usuario social que no completó datos)
    if (error.response?.status === 403) {
      const body = error.response.data as any;
      if (body?.detail?.code === "PROFILE_INCOMPLETE") {
        // Importar dinámico para evitar dependencia circular
        const { router } = await import("expo-router");
        router.push("/(auth)/complete-profile");
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem<string>(
          CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        );

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Llamar al endpoint de refresh
        const response = await axios.post<LoginResponse>(
          `${CONFIG.API_URL}/auth/refresh`,
          { refresh_token: refreshToken },
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Guardar nuevos tokens
        await storage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, access_token);
        await storage.setItem(
          CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
          newRefreshToken,
        );

        processQueue(null, access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);

        await forceLogout();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
