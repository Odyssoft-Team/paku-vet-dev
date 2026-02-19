import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Loading } from "@/components/common/Loading";
import { useTheme } from "@/hooks/useTheme";
import { usePetStore } from "@/store/petStore";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Pet } from "@/types/pet.types";
import { useAddressStore } from "@/store/addressStore";
import { useBookingStore } from "@/store/bookingStore";

interface PetSelectionCardProps {
  pet: Pet;
  onPress: () => void;
}

const PetSelectionCard: React.FC<PetSelectionCardProps> = ({
  pet,
  onPress,
}) => {
  const { colors } = useTheme();

  const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();

    if (years === 0) {
      return `${months}m`;
    } else if (months < 0) {
      return `${years - 1}a`;
    } else {
      return `${years}a`;
    }
  };

  const styles = StyleSheet.create({
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
  });

  return (
    <TouchableOpacity key={pet.id} style={styles.petCard} onPress={onPress}>
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
  );
};

export default function SelectPetForServiceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { pets, isLoading, fetchPets } = usePetStore();
  const { setPet, clearBooking } = useBookingStore();
  const { addresses, fetchAddresses, error } = useAddressStore();

  useEffect(() => {
    // Disparamos el fetch al montar el componente
    fetchAddresses();
  }, []);

  console.log("addresses", addresses);

  useEffect(() => {
    if (pets.length === 0) {
      fetchPets();
    }
  }, []);

  const handlePetSelect = (pet: Pet) => {
    // Empezamos un nuevo booking limpio y guardamos la mascota en el store
    clearBooking();
    setPet(pet.id);
    router.push("/(tabs)/(user)/service-details");
  };

  if (isLoading && pets.length === 0) {
    return <Loading message="Cargando mascotas..." fullScreen />;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      position: "relative",
    },
    backButton: {
      position: "absolute",
      left: Spacing.md,
      width: 40,
    },
    headerTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
    },
    scrollContent: {
      padding: Spacing.md,
    },
    question: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.lg,
    },
    petsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    petCard: {
      width: "48%",
      height: 200,
      borderRadius: BorderRadius.xl,
      overflow: "hidden",
      marginBottom: Spacing.md,
      ...Shadows.md,
    },
    petImage: {
      width: "100%",
      height: "100%",
    },
    petImageStyle: {
      borderRadius: BorderRadius.xl,
    },
    petOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "flex-end",
      padding: Spacing.md,
    },
    petName: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      marginBottom: Spacing.xs,
    },
    petDetails: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: "#FFFFFF",
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
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/(user)/services")}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selección de mascota</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.question, { color: colors.primary }]}>
          ¿Para quién es este servicio?
        </Text>

        <View style={styles.petsGrid}>
          {pets.length > 0 ? (
            pets.map((pet) => (
              <PetSelectionCard
                key={pet.id}
                pet={pet}
                onPress={() => handlePetSelect(pet)}
              />
            ))
          ) : (
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
                Registra a tu primera mascota para comenzar a gestionar sus
                citas y servicios
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
