export type UserRole = "admin" | "ally" | "user";
export type UserSex = "male" | "female" | "other";

export interface Address {
  district_id: string;
  address_line: string;
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  // Campos opcionales para usuarios con social login que no completaron perfil
  phone: string | null;
  first_name: string;
  last_name: string;
  sex: UserSex | null;
  birth_date: string | null;
  dni?: string | null;
  address?: Address;
  profile_photo_url?: string | null;
  // Campo nuevo: indica si el perfil está completo
  profile_completed: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  phone: string;
  first_name: string;
  last_name: string;
  sex: UserSex;
  birth_date: string;
  role?: UserRole;
  dni?: string;
  address?: Address;
  profile_photo_url?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterResponse extends User {}

// Respuesta del endpoint POST /auth/social
export interface SocialAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_new_user: boolean;
}

// Datos para completar perfil (PUT /users/me/complete)
export interface CompleteProfileData {
  phone: string;
  sex: UserSex;
  birth_date: string; // formato "YYYY-MM-DD"
  dni?: string;
}

// Error específico de social auth (ej: EMAIL_ALREADY_REGISTERED)
export class SocialAuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "SocialAuthError";
  }
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
