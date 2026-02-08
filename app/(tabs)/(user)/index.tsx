import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { Typography, Spacing } from "@/constants/theme";
import { HomeHeader } from "@/components/home/HomeHeader";
import { BannerCard } from "@/components/home/BannerCard";
import { RegisterPetCard } from "@/components/home/RegisterPetCard";
import { ServiceCard } from "@/components/home/ServiceCard";
import { OfferCard } from "@/components/home/OfferCard";
import { AddressDrawer } from "@/components/home/AddressDrawer";
import { Text } from "@/components/common/Text";

export default function UserHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);

  const insets = useSafeAreaInsets();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("1");

  // Mock de direcciones - Esto vendrá de tu API
  const addresses = [
    {
      id: "1",
      address: "Jr. Parque del bosque 500",
      isDefault: selectedAddressId === "1",
    },
    {
      id: "2",
      address: "Av. Principal 123, San Isidro",
      isDefault: selectedAddressId === "2",
    },
  ];

  const selectedAddress = addresses.find(
    (addr) => addr.id === selectedAddressId,
  );

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
  };

  const handleAddNewAddress = () => {
    router.push("/(auth)/select-location");
  };

  const handleRegisterPet = () => {
    // Navegar al formulario de registro de mascota
    console.log("Register pet");
  };

  const handleServicePress = () => {
    // Navegar a detalle de servicio
    console.log("Service pressed");
  };

  const handleOfferPress = () => {
    // Navegar a detalle de oferta
    console.log("Offer pressed");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      color: colors.primary,
    },
    sectionMargin: {
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.md,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header fijo */}
      <HomeHeader
        userName={user?.first_name || "Usuario"}
        address={selectedAddress?.address || "Selecciona una dirección"}
        onAddressPress={() => setDrawerVisible(true)}
      />

      {/* Contenido scrolleable */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner principal */}
        <BannerCard
          title="Grooming sin estrés"
          subtitle="Elige el PAKU Spa ideal para tu mascota."
        />

        {/* Registrar mascota */}
        <View style={styles.sectionMargin}>
          <RegisterPetCard onPress={handleRegisterPet} />
        </View>

        {/* Servicios */}
        <View style={styles.sectionMargin}>
          <Text variant="bold" style={styles.sectionTitle}>
            Nuestros servicios
          </Text>
          <ServiceCard
            title="PAKU Spa"
            subtitle="Grooming inteligente."
            onPress={handleServicePress}
          />
        </View>

        {/* Ofertas */}
        <View style={styles.sectionMargin}>
          <OfferCard
            discount="20% OFF"
            description="en tu primer PAKU Spa"
            onPress={handleOfferPress}
          />
        </View>
      </ScrollView>

      {/* Drawer de direcciones */}
      <AddressDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        addresses={addresses}
        onSelectAddress={handleSelectAddress}
        onAddNew={handleAddNewAddress}
      />
    </SafeAreaView>
  );
}
