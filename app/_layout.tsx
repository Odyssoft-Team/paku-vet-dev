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
// webClientId: se obtiene de Firebase Console → Configuración del proyecto
// → Tus apps → Web app → OAuth client ID (client_type: 3)
GoogleSignin.configure({
  webClientId:
    "551350554084-tvt4hi0u6k4vu8juhbcqj5pnqu31loh2.apps.googleusercontent.com",
  // ⚠️ REEMPLAZAR con el webClientId real del proyecto Firebase
  // Se encuentra en google-services.json → oauth_client → client_type: 3
  // O en Firebase Console → Project Settings → Web apps
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

    // NO redirigir si hay un error (el usuario está intentando loguearse)
    if (error && !inAuthGroup && !isAuthenticated) {
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      // No autenticado y no está en auth -> ir a login
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup && user) {
      // Autenticado pero está en auth -> ir a su dashboard
      switch (user.role) {
        case "admin":
          router.replace("/(tabs)/(admin)");
          break;
        case "groomer":
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
