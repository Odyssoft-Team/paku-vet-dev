import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Loading } from '@/components/common/Loading';

export default function Index() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { isLoading: themeLoading } = useThemeStore();

  // Mostrar loading mientras se inicializa
  if (authLoading || themeLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  // Redirigir según el estado de autenticación
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
