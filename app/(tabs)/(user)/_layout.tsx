import { Tabs } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/common/Icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Shadows } from "@/constants/theme";

export default function UserLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          // borderTopColor: colors.border,
          // borderTopWidth: 1,
          height: 60 + insets.bottom, // Altura de la tab bar
          paddingBottom: insets.bottom, // Padding inferior
          paddingTop: 8, // Padding superior
          // elevation: 8, // Sombra en Android
          // shadowColor: "#000", // Sombra en iOS
          // shadowOffset: { width: 0, height: -2 },
          // shadowOpacity: 0.1,
          // shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="pets"
        options={{
          title: "Mascotas",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="pets" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Servicios",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="services" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notificaciones",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="notification" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="profile" size={size} color={color} />
          ),
        }}
      />

      {/* Pantallas ocultas del tab bar */}
      <Tabs.Screen
        name="pet-detail"
        options={{
          href: null, // Esto la oculta del tab bar
        }}
      />
    </Tabs>
  );
}
