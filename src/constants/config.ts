// Configuración general de la aplicación
export const CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  API_TIMEOUT: 30000,
  
  // Tiempos de expiración (en milisegundos)
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos antes de expirar
  
  // Configuración de paginación
  DEFAULT_PAGE_SIZE: 10,
  
  // Claves de almacenamiento
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@paku_access_token',
    REFRESH_TOKEN: '@paku_refresh_token',
    USER_DATA: '@paku_user_data',
    THEME_MODE: '@paku_theme_mode',
  },
} as const;
