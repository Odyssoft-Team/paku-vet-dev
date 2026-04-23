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
import { useTokenRefresh } from "@/hooks";

// Prevenir que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

// Configurar Google Sign-In al cargar el módulo (una sola vez)
GoogleSignin.configure({
  webClientId:
    "288581456018-109m19jccedofh328if0t0l0fo3abnoq.apps.googleusercontent.com",
});

export default function RootLayout() {
  useTokenRefresh();
  const router = useRouter();
  const segments = useSegments();
  const {
    isAuthenticated,
    isLoading,
    loadStoredAuth,
    user,
    error,
    sessionExpired,
  } = useAuthStore();
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
    if (isLoading || !appIsReady) return; // ← agregar appIsReady aquí

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login"); // ← ahora sí funciona, estamos dentro de React
      return;
    }

    if (isAuthenticated && inAuthGroup && user) {
      const inCompleteProfile =
        (segments as string[])[1] === "complete-profile";
      if (inCompleteProfile) return;

      switch (user.role) {
        case "admin":
          router.replace("/(tabs)/(admin)");
          break;
        case "ally":
          router.replace("/(tabs)/(groomer)");
          break;
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
