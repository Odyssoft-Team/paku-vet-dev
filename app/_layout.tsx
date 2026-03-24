import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Loading } from "@/components/common/Loading";
import { useFonts } from "expo-font";
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Prevenir que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

// Configurar Google Sign-In al cargar el módulo (una sola vez)
GoogleSignin.configure({
  webClientId:
    "551350554084-tvt4hi0u6k4vu8juhbcqj5pnqu31loh2.apps.googleusercontent.com",
  // ⚠️ REEMPLAZAR con el webClientId real del proyecto Firebase
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, loadStoredAuth, user, error } =
    useAuthStore();
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  // Cargar auth solo una vez al inicio
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Esperar a que las fuentes carguen
  useEffect(() => {
    if (fontsLoaded) {
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Manejar redirecciones
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inCompleteProfile = (segments as string[])[1] === "complete-profile";

    // NO redirigir si hay un error (el usuario está intentando loguearse)
    if (error && !inAuthGroup && !isAuthenticated) {
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      // No autenticado y no está en auth -> ir a login
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup && user) {
      // Si está completando perfil (usuario social nuevo), no interrumpir
      if (inCompleteProfile) return;

      // Autenticado pero está en auth -> ir a su dashboard según rol
      switch (user.role) {
        case "admin":
          router.replace("/(tabs)/(admin)");
          break;
        case "ally":
          router.replace("/(tabs)/(groomer)");
          break;
        case "user":
        default:
          router.replace("/(tabs)/(user)");
          break;
      }
    }
  }, [isAuthenticated, isLoading, segments, user, appIsReady]);

  if (!appIsReady) {
    return <Loading fullScreen />;
  }

  return <Slot />;
}
