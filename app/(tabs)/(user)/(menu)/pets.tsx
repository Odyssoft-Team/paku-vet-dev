import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Loading } from "@/components/common/Loading";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { usePetStore } from "@/store/petStore";
import { Pet } from "@/types/pet.types";

export default function PetsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { pets, isLoading, fetchPets } = usePetStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    await fetchPets();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPets();
    setRefreshing(false);
  };

  const handlePetPress = (pet: Pet) => {
    router.push({
      pathname: "/(tabs)/(user)/pet-detail",
      params: { petId: pet.id },
    });
  };

  const handleAddPet = () => {
    router.push("/(screens)/add-pet-step1");
  };

  const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();

    if (years === 0) {
      return `${months}m`;
    } else if (months < 0) {
      return `${years - 1}a ${12 + months}m`;
    } else {
      return months === 0 ? `${years}a` : `${years}a ${months}m`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    backButton: {
      padding: Spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
    },
    cartButton: {
      padding: Spacing.sm,
    },
    scrollContent: {
      padding: Spacing.md,
      paddingBottom: 100,
    },
    petsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    petCard: {
      width: "48%",
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      backgroundColor: colors.surface,
      ...Shadows.md,
    },
    petImageContainer: {
      width: "100%",
      height: 210,
      backgroundColor: colors.border,
    },
    petImage: {
      width: "100%",
      height: "100%",
      resizeMode: "center",
    },
    petPlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary + "20",
    },
    petPlaceholderEmoji: {
      fontSize: 64,
    },
    petInfo: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      alignItems: "flex-start",
      justifyContent: "flex-end",
    },
    petName: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      color: colors.surface,
    },
    petDetails: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: colors.surface,
      lineHeight: 20,
      marginBottom: Spacing.xs,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    emptyIcon: {
      marginBottom: Spacing.lg,
    },
    emptyText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
      textAlign: "center",
      marginBottom: Spacing.xs,
    },
    emptySubtext: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: Spacing.xl,
    },
    addButton: {
      position: "absolute",
      bottom: "2%",
      left: Spacing.md,
      right: Spacing.md,
      backgroundColor: colors.secondary + "20",
      borderWidth: 1,
      borderColor: colors.secondary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.xl,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    },
    addButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
      lineHeight: 18,
    },
  });

  if (isLoading && pets.length === 0) {
    return <Loading message="Cargando mascotas..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/(user)")}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis mascotas</Text>
        <TouchableOpacity style={styles.cartButton}>
          <Icon name="cart" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {pets.length === 0 ? (
          // Empty state
          <View style={styles.emptyContainer}>
            <Icon
              name="pets"
              size={80}
              color={colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              Aún no tienes mascotas registradas
            </Text>
            <Text style={styles.emptySubtext}>
              Registra a tu primera mascota para comenzar a gestionar sus citas
              y servicios
            </Text>
          </View>
        ) : (
          // Pets grid
          <View style={styles.petsGrid}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={styles.petCard}
                onPress={() => handlePetPress(pet)}
              >
                <View style={styles.petImageContainer}>
                  {pet.photo_url ? (
                    <Image
                      source={{ uri: pet.photo_url }}
                      style={styles.petImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={require("@assets/images/profile/profile-pet.png")}
                      style={styles.petImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petDetails}>{pet.breed}</Text>
                  <Text style={styles.petDetails}>
                    {calculateAge(pet.birth_date)} • {pet.weight_kg}kg
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Pet Button - Fixed at bottom */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
        <Icon name="plus" size={18} color={colors.primary} />
        <Text style={styles.addButtonText}>Registrar mascota</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
