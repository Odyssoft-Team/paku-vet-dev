import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { PetCard } from "./PetCard";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
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
      // marginBottom: Spacing.sm,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    title: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    scrollContainer: {
      paddingRight: Spacing.md,
    },
    addButton: {
      width: 130,
      height: 130,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.secondary + "20",
      borderWidth: 1,
      borderColor: colors.secondary,
      // borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      marginRight: Spacing.sm,
    },
    addIcon: {
      marginBottom: Spacing.xs,
    },
    addText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis mascotas</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} onPress={onPetPress} />
        ))}

        {/* Botón para agregar nueva mascota */}
        <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
          <Icon
            name="plus"
            size={24}
            color={colors.primary}
            style={styles.addIcon}
          />
          <Text style={styles.addText}>Registrar{"\n"}mascota</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
