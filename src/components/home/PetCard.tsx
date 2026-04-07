import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { Text } from "@/components/common/Text";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Pet } from "@/types/pet.types";

interface PetCardProps {
  pet: Pet;
  onPress: (pet: Pet) => void;
}

export const PetCard: React.FC<PetCardProps> = ({ pet, onPress }) => {
  const { colors } = useTheme();
  console.log(
    "[PetCard]",
    pet.name,
    "photo_url:",
    pet.photo_url?.substring(0, 60),
  );

  const styles = StyleSheet.create({
    card: {
      width: 110,
      height: 110,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      marginRight: Spacing.sm,
      ...Shadows.md,
    },
    imageBackground: {
      width: "100%",
      height: "100%",
      justifyContent: "flex-end",
    },
    gradient: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      zIndex: 1,
    },
    nameContainer: {
      padding: Spacing.sm,
      zIndex: 2,
      justifyContent: "center",
      alignItems: "center",
      borderBottomLeftRadius: BorderRadius.lg,
      borderBottomRightRadius: BorderRadius.lg,
    },
    petName: {
      fontSize: Typography.fontSize.md, // Reducido de lg a md
      fontFamily: Typography.fontFamily.semibold, // Cambiado de bold a semibold
      color: "#FFFFFF",
      textAlign: "center",
    },
    placeholder: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      fontSize: 48,
      color: colors.primary + "40",
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(pet)}>
      {pet.photo_url ? (
        <ImageBackground
          source={{ uri: pet.photo_url }}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          <View style={styles.gradient} />
          <View style={styles.nameContainer}>
            <Text style={styles.petName}>{pet.name}</Text>
          </View>
        </ImageBackground>
      ) : (
        <ImageBackground
          source={require("@assets/images/profile/profile-pet.png")}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          <View style={styles.gradient} />
          <View style={styles.nameContainer}>
            <Text style={styles.petName}>{pet.name}</Text>
          </View>
        </ImageBackground>
      )}
    </TouchableOpacity>
  );
};
