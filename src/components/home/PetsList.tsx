// components/home/PetsList.tsx
import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { PetCard } from "./PetCard";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Pet } from "@/types/pet.types";

interface PetsListProps {
  pets: Pet[];
  onPetPress: (pet: Pet) => void;
  onAddPress: () => void;
}

export const PetsList: React.FC<PetsListProps> = ({
  pets,
  onPetPress,
  onAddPress,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: Spacing.sm,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    viewAll: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: colors.primary,
    },
    scrollContainer: {
      paddingRight: Spacing.lg,
      gap: Spacing.md,
    },
    addButton: {
      width: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    addCard: {
      width: 80,
      height: 80,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    addText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.medium,
      color: colors.primary,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis mascotas</Text>
        <TouchableOpacity onPress={onAddPress}>
          <Text style={styles.viewAll}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} onPress={onPetPress} />
        ))}

        {pets.length === 0 && (
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <View style={styles.addCard}>
              <Icon name="plus" size={24} color={colors.primary} />
            </View>
            <Text style={styles.addText}>Nueva mascota</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};
