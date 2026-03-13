import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { useAddressStore } from "@/store/addressStore";
import { usePetStore } from "@/store/petStore";
import { PetsList } from "@/components/home/PetsList";
import { Button } from "@/components/common";
import { OrderProgressBar } from "@/components/common/OrdenProgressBar";
import { useActiveOrder } from "@/hooks/useActiveOrder";

const ACTIVE_STATUSES = ["on_the_way", "in_service"];

export default function UserHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);

  // Address store
  const { addresses, isLoading, fetchAddresses, setDefaultAddress } =
    useAddressStore();

  // Orden activa con polling inteligente (pausa en background, limpia al desmontar)
  const { order, loadActiveOrder } = useActiveOrder();

  // Pet store
  const { pets, isLoading: loadingPets, fetchPets } = usePetStore();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAddresses();
    fetchPets();
  }, []);

  // ── Pull to refresh ────────────────────────────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAddresses(), loadActiveOrder(), fetchPets()]);
    setRefreshing(false);
  };

  // ── Dirección por defecto ──────────────────────────────────────────────────
  const defaultAddress = addresses.find((addr) => addr.is_default);

  const handleSelectAddress = async (id: string) => {
    try {
      await setDefaultAddress(id);
    } catch (error) {
      console.log("Error setting default address:", error);
    }
  };

  const handleAddNewAddress = () => {
    router.push("/(screens)/add-address");
  };

  const handleRegisterPet = () => {
    router.push("/(screens)/add-pet-step1");
  };

  const handlePetPress = (pet: any) => {
    router.push({
      pathname: "/(tabs)/(user)/pet-detail",
      params: { petId: pet.id },
    });
  };

  const handleServicePress = () => {
    router.push("/(tabs)/(user)/services");
  };

  const handleOfferPress = () => {};

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: Spacing.sm,
    },
    sectionMargin: {
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.md,
    },
    sectionTracking: {
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    titleTracking: {
      color: colors.primary,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.bold,
    },
    textTracking: {
      fontSize: Typography.fontSize.xs,
      opacity: 0.75,
      color: colors.primary,
    },
    buttonTracking: {
      paddingVertical: Spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header fijo */}
      <HomeHeader
        userName={user?.first_name || "Usuario"}
        address={
          defaultAddress?.address_line
            ? `${defaultAddress.address_line} ${defaultAddress.building_number}`
            : "Agrega una dirección"
        }
        onAddressPress={() => setDrawerVisible(true)}
      />

      {/* Banner de orden activa */}
      {order && ACTIVE_STATUSES.includes(order.status) && (
        <View style={styles.sectionTracking}>
          <Text variant="regular" style={styles.titleTracking}>
            {order.status === "in_service"
              ? "¡Tu mascota está siendo atendida!"
              : order.status === "on_the_way"
                ? "¡Tu groomer está en camino!"
                : "Preparando tu servicio..."}
          </Text>
          <Text variant="regular" style={styles.textTracking} numberOfLines={1}>
            {order.status === "in_service"
              ? "Puedes ver el streaming en vivo"
              : "Llegada estimada: 15:30 h"}
          </Text>
          <OrderProgressBar currentStatus={order.status} />
          <Button
            title="Rastrear"
            textStyle={{ fontSize: Typography.fontSize.xs }}
            style={styles.buttonTracking}
            onPress={() => router.push("/(tabs)/(user)/tracking-service")}
            fullWidth
          />
        </View>
      )}

      {/* Contenido scrolleable */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Banner principal */}
        <BannerCard
          title="Grooming sin estrés"
          subtitle="Elige el PAKU Spa ideal para tu mascota."
        />

        {/* Mascotas */}
        <View style={styles.sectionMargin}>
          {pets.length === 0 ? (
            <RegisterPetCard onPress={handleRegisterPet} />
          ) : (
            <PetsList
              pets={pets}
              onPetPress={handlePetPress}
              onAddPress={handleRegisterPet}
            />
          )}
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
        addresses={addresses.map((addr) => ({
          id: addr.id,
          address: `${addr.address_line} ${addr.building_number}${
            addr.apartment_number ? `, ${addr.apartment_number}` : ""
          }`,
          isDefault: addr.is_default,
        }))}
        onSelectAddress={handleSelectAddress}
        onAddNew={handleAddNewAddress}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}
