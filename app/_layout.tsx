import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

export default function RootLayout() {
  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth);
  const loadTheme = useThemeStore((state) => state.loadTheme);

  // Inicializar autenticación y tema
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadStoredAuth(), loadTheme()]);
    };
    initialize();
  }, [loadStoredAuth, loadTheme]);

  // Hook para refrescar token automáticamente
  useTokenRefresh();

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
