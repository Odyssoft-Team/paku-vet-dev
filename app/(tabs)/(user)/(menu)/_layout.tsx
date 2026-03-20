import { Tabs } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/common/Icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CartDrawer } from "@/components/common/CartDrawer";
import { Typography } from "@/constants/theme";

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
    "additional-service",
    "address-form",
    "select-address",
    "add-address-for-service",
    "confirm-address-for-service",
    "select-date",
    "cart",
    "invoice-form",
    "healt-detail",
    "history-detail",
    "addresses",
    "tracking-service",
    "live-view",
    "my-cards",
  ];

  return (
    <>
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
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: Typography.fontFamily.semibold,
            fontWeight: Typography.fontWeight.bold,
            marginBottom: 4,
          },
        }}
      >
        {/* 1. Pestañas VISIBLES en el menú */}
        <Tabs.Screen
          name="pets"
          options={{
            title: "Mascotas",
            tabBarIcon: ({ color }) => (
              <Icon name="pets" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            title: "Servicios",
            tabBarIcon: ({ color }) => (
              <Icon name="services" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) => (
              <Icon name="home" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Avisos",
            tabBarIcon: ({ color }) => (
              <Icon name="notification" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => (
              <Icon name="profile" size={20} color={color} />
            ),
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

      {/* Drawer global — disponible en todas las pantallas */}
      <CartDrawer />
    </>
  );
}
