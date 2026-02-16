import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

const queryClients = new QueryClient();

export default function UserLayout() {
  return (
    <QueryClientProvider client={queryClients}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* La pantalla principal ahora es el grupo de pestañas */}
        <Stack.Screen name="(menu)" />

        {/* No necesitas registrar las demás una por una, 
          Stack las reconoce automáticamente */}
      </Stack>
    </QueryClientProvider>
  );
}
