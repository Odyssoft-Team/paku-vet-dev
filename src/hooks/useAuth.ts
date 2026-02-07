import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadStoredAuth,
    setUser,
    clearError,
  } = useAuthStore();

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadStoredAuth,
    setUser,
    clearError,
  };
};
