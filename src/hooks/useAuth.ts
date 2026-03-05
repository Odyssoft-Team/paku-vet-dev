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
    socialLogin,
    completeProfile,
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
    socialLogin,
    completeProfile,
    logout,
    loadStoredAuth,
    setUser,
    clearError,
  };
};
