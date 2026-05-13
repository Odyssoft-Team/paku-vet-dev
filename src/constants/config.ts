// Configuración general de la aplicación
export const CONFIG = {
  API_URL:
    process.env.EXPO_PUBLIC_API_URL || "https://paku.dev-qa.site/paku/api/v1",

  // Base URL para endpoints de media (puede diferir del API_URL principal)
  // ⚠️ Cambiar este valor cuando el backend confirme la URL correcta
  MEDIA_API_URL:
    process.env.EXPO_PUBLIC_MEDIA_API_URL ||
    "https://paku.dev-qa.site/paku/api/v1",

  // ── Culqi ─────────────────────────────────────────────────────────────────
  // Clave pública de Culqi (pk_test_... o pk_live_...)
  // Se usa SOLO para tokenizar tarjetas directamente con Culqi.
  // NUNCA usar la secret key aquí.
  CULQI_PUBLIC_KEY: process.env.EXPO_PUBLIC_CULQI_PUBLIC_KEY || "",

  // URL base del microservicio de pagos (Culqi backend)
  PAYMENT_API_URL:
    process.env.EXPO_PUBLIC_PAYMENT_API_URL ||
    "https://stream.dev-qa.site/payment",

  // API Key del microservicio de pagos (header X-API-Key)
  PAYMENT_API_KEY: process.env.EXPO_PUBLIC_PAYMENT_API_KEY || "",

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
