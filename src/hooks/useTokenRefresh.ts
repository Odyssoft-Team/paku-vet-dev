import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { storage } from "@/utils/storage";
import { CONFIG } from "@/constants/config";
import { isTokenExpiringSoon } from "@/utils/helpers";
import { authService } from "@/api/services/auth.service";

/**
 * Hook para manejar el refresh automático del token
 */
export const useTokenRefresh = () => {
  const { tokens, isAuthenticated, logout } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !tokens?.access_token) {
      // Limpiar intervalo si no está autenticado
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkAndRefreshToken = async () => {
      try {
        const accessToken = await storage.getItem<string>(
          CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        );

        if (!accessToken) {
          await logout();
          return;
        }

        // Verificar si el token está por expirar
        if (isTokenExpiringSoon(accessToken, CONFIG.TOKEN_REFRESH_THRESHOLD)) {
          const refreshToken = await storage.getItem<string>(
            CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
          );

          if (!refreshToken) {
            await logout();
            return;
          }

          // Refrescar el token
          const response = await authService.refreshToken(refreshToken);

          // Actualizar tokens en storage
          await storage.setItem(
            CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
            response.access_token,
          );
          await storage.setItem(
            CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
            response.refresh_token,
          );

          console.log("Token refreshed successfully");
        }
      } catch (error) {
        console.log("Error refreshing token:", error);
        await logout();
      }
    };

    // Verificar inmediatamente
    checkAndRefreshToken();

    // Verificar cada 4 minutos (240000 ms)
    intervalRef.current = setInterval(checkAndRefreshToken, 240000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, tokens, logout]);
};
