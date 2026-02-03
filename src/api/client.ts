import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '@/constants/config';
import { storage } from '@/utils/storage';
import { AuthTokens } from '@/types/auth.types';

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag para evitar múltiples intentos de refresh
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

// Interceptor de request para agregar token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Obtener token del storage
    const accessToken = await storage.getItem<string>(
      CONFIG.STORAGE_KEYS.ACCESS_TOKEN
    );

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response para manejar errores y refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Si es error 401 y no hemos intentado hacer refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya se está refrescando, agregar a la cola
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
          CONFIG.STORAGE_KEYS.REFRESH_TOKEN
        );

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Llamar al endpoint de refresh
        const response = await axios.post<{ tokens: AuthTokens }>(
          `${CONFIG.API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.tokens;

        // Guardar nuevos tokens
        await storage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await storage.setItem(
          CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
          newRefreshToken
        );

        // Procesar cola de peticiones
        processQueue(null, accessToken);

        // Reintentar la petición original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        
        // Limpiar storage si el refresh falla
        await storage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        await storage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
        await storage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
