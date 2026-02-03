import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function TabsLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirigir según el rol del usuario
  switch (user.role) {
    case 'admin':
      return <Redirect href="/(tabs)/(admin)" />;
    case 'groomer':
      return <Redirect href="/(tabs)/(groomer)" />;
    case 'user':
      return <Redirect href="/(tabs)/(user)" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
