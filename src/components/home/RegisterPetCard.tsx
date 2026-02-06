import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface RegisterPetCardProps {
  onPress: () => void;
}

export const RegisterPetCard: React.FC<RegisterPetCardProps> = ({
  onPress,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.secondary + "20",
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 2,
      borderColor: colors.secondary,
      borderStyle: "dashed",
    },
    title: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: Spacing.sm,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      gap: Spacing.sm,
    },
    buttonText: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Empieza registrando a tu mascota</Text>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Icon name="plus" size={20} color={colors.primary} />
        <Text style={styles.buttonText}>Registrar mascota</Text>
      </TouchableOpacity>
    </View>
  );
};
