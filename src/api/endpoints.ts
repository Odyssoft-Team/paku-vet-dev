export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // Usuarios
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },

  // Administrador
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    GROOMERS: '/admin/groomers',
    CLIENTS: '/admin/clients',
  },

  // Groomer
  GROOMER: {
    APPOINTMENTS: '/groomer/appointments',
    SCHEDULE: '/groomer/schedule',
  },

  // Cliente
  CLIENT: {
    PETS: '/client/pets',
    APPOINTMENTS: '/client/appointments',
  },
} as const;
