export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
  },

  // Usuarios
  USERS: {
    ME: "/users/me",
    UPDATE_ME: "/users/me",
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
} as const;
