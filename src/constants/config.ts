// Configuración general de la aplicación
export const CONFIG = {
  API_URL:
    process.env.EXPO_PUBLIC_API_URL || "https://paku.dev-qa.site/paku/api/v1",

  // Base URL para endpoints de media (puede diferir del API_URL principal)
  // ⚠️ Cambiar este valor cuando el backend confirme la URL correcta
  MEDIA_API_URL:
    process.env.EXPO_PUBLIC_MEDIA_API_URL ||
    "https://paku.dev-qa.site/paku/api/v1",

  API_TIMEOUT: 30000,

  // Tiempos de expiración (en milisegundos)
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos antes de expirar

  // Configuración de paginación
  DEFAULT_PAGE_SIZE: 10,

  // Claves de almacenamiento
  STORAGE_KEYS: {
    ACCESS_TOKEN: "@paku/access_token",
    REFRESH_TOKEN: "@paku/refresh_token",
    USER_DATA: "@paku/user_data",
    THEME_MODE: "@paku_theme_mode",
  },
} as const;
