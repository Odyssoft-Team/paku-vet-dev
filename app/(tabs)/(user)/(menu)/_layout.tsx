import { Tabs } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/common/Icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MenuLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const hiddenScreens = [
    "service-selected",
    "service-details",
    "pet-detail",
    "select-pet",
    "legal",
    "complaints",
    "support",
    "payments",
    "preferences",
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
      }}
    >
      {/* 1. Pestañas VISIBLES en el menú */}
      <Tabs.Screen
        name="pets"
        options={{
          title: "Mascotas",
          tabBarIcon: ({ color }) => <Icon name="pets" color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Servicios",
          tabBarIcon: ({ color }) => <Icon name="services" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Avisos",
          tabBarIcon: ({ color }) => <Icon name="notification" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Icon name="profile" color={color} />,
        }}
      />
      {hiddenScreens.map((screenName) => (
        <Tabs.Screen
          key={screenName}
          name={screenName}
          options={{ href: null }}
        />
      ))}
    </Tabs>
  );
}
