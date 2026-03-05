import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { SocialAuthError } from "@/types/auth.types";
import { getGoogleIdToken, getGoogleSignInErrorMessage } from "@/api/services/google-auth.service";

interface UseGoogleAuthReturn {
  isLoading: boolean;
  handleGoogleSignIn: () => Promise<void>;
}

/**
 * Hook que encapsula el flujo completo de Google Sign-In.
 *
 * Uso:
 *   const { isLoading, handleGoogleSignIn } = useGoogleAuth({ onError });
 */
export function useGoogleAuth(options?: {
  onError?: (message: string) => void;
}): UseGoogleAuthReturn {
  const router = useRouter();
  const { socialLogin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // 1. Obtener Firebase ID Token via Google Sign-In
      const firebaseIdToken = await getGoogleIdToken();

      // 2. Autenticar en backend Paku y actualizar store
      const { is_new_user } = await socialLogin(firebaseIdToken);

      // 3. Navegar según el estado del perfil
      if (is_new_user) {
        // Perfil incompleto — ir a completar datos
        router.replace("/(auth)/complete-profile");
      } else {
        // Sesión lista — ir a home del usuario
        router.replace("/(tabs)/(user)");
      }
    } catch (error: any) {
      const message = getGoogleSignInErrorMessage(error);
      if (message && options?.onError) {
        options.onError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleGoogleSignIn };
}