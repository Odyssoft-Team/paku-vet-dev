export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    SOCIAL: "/auth/social",
  },

  // Autenticación social
  SOCIAL: "/auth/social",

  // Usuarios
  USERS: {
    ME: "/users/me",
    UPDATE_ME: "/users/me",
    COMPLETE_PROFILE: "/users/me/complete",
  },

  // Direcciones
  ADDRESSES: {
    LIST: "/addresses",
    CREATE: "/addresses",
    DETAIL: (id: string) => `/addresses/${id}`,
    UPDATE: (id: string) => `/addresses/${id}`,
    DELETE: (id: string) => `/addresses/${id}`,
    UPDATE_DEFAULT: (id: string) => `/addresses/${id}/default`,
  },

  // Geografía
  GEO: {
    DISTRICTS: "/geo/districts",
  },

  // Disponibilidad
  AVAILABILITY: {
    GET: "/availability",
  },

  // Mascotas
  PETS: {
    LIST: "/pets",
    CREATE: "/pets",
    DETAIL: (id: string) => `/pets/${id}`,
    UPDATE: (id: string) => `/pets/${id}`,
    DELETE: (id: string) => `/pets/${id}`,
  },

  // Catálogo
  CATALOG: {
    BREEDS: "/catalog/breeds",
  },

  // Servicios de SPA
  SPA: {
    LIST: "/paku-spa/plans",
  },

  // Comercio / Servicios
  COMMERCE: {
    SERVICES: "/services",
  },

  // Notificaciones
  NOTIFICATIONS: {
    LIST: "/notifications",
    UNREAD_COUNT: "/notifications/unread-count",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },

  STORE: {
    CATEGORIES: "/store/categories",
    PRODUCTS: (slug: string) => `/store/categories/${slug}/products`,
    PRODUCT: (id: string) => `/store/products/${id}`,
    QUOTE: "/store/quote",
  },

  // Carrito
  CART: {
    GET: "/cart",
    CREATE_WITH_ITEMS: "/cart/items",
    REPLACE_ITEMS: (id: string) => `/cart/${id}/items`,
    DELETE_ITEM: (id: string, itemId: string) => `/cart/${id}/items/${itemId}`,
    VALIDATE: (id: string) => `/cart/${id}/validate`,
    CHECKOUT: (id: string) => `/cart/${id}/checkout`,
  },

  // Órdenes
  ORDERS: {
    LIST: "/orders",
    BY_ID: (id: string) => `/orders/${id}`,
    CREATE: "/orders",
  },

  // Administrador
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    GROOMERS: "/admin/groomers",
    CLIENTS: "/admin/clients",
  },

  // Groomer
  GROOMER: {
    APPOINTMENTS: "/groomer/appointments",
    SCHEDULE: "/groomer/schedule",
  },

  // Cliente
  CLIENT: {
    PETS: "/client/pets",
    APPOINTMENTS: "/client/appointments",
  },

  // Clinical History
  CLINICAL_HISTORY: {
    BY_PET: (petId: string) => `/pets/${petId}/clinical-history`,
  },

  // Media (fotos de perfil — usuario y mascota)
  MEDIA: {
    SIGNED_UPLOAD: "/media/signed-upload",
    CONFIRM_PHOTO: "/media/confirm-profile-photo",
    SIGNED_READ: "/media/signed-read",
  },

  // Tracking en tiempo real (on_the_way / in_service)
  // Base URL: https://<dominio> — sin /paku/api/v1
  TRACKING: {
    CURRENT: (orderId: string) => `/tracking/orders/${orderId}/current`,
    ROUTE: (orderId: string) => `/tracking/orders/${orderId}/route`,
  },

  // Mercado Pago — base: https://stream.dev-qa.site/payment/api
  PAYMENT: {
    METHODS_LIST: "/payment-methods",
    METHODS_SAVE: "/payment-methods",
    PAY: "/payments/pay",
    STATUS: (orderId: string) => `/payments/${orderId}/status`,
  },
} as const;
