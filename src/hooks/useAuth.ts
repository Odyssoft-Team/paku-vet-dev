import { useAuthStore } from '@/store/authStore';
import { LoginCredentials, RegisterData } from '@/types/auth.types';

/**
 * Hook personalizado para manejar la autenticación
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  } = useAuthStore();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await login(credentials);
    } catch (error) {
      // Error ya manejado en el store
      throw error;
    }
  };

  const handleRegister = async (data: RegisterData) => {
    try {
      await register(data);
    } catch (error) {
      // Error ya manejado en el store
      throw error;
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
  };
};
