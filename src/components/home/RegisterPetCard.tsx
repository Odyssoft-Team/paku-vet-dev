// components/home/RegisterPetCard.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Text } from "../common/Text";

interface RegisterPetCardProps {
  onPress: () => void;
}

export const RegisterPetCard: React.FC<RegisterPetCardProps> = ({
  onPress,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      ...Shadows.sm,
    },
    title: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
      marginBottom: Spacing.xs,
      textAlign: "center",
    },
    description: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.lg,
      lineHeight: 20,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      gap: Spacing.sm,
    },
    buttonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFFFFF",
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido a PAKU! 🐾</Text>
      <Text style={styles.description}>
        Registra a tu mascota para comenzar a disfrutar de nuestros servicios
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={16} color="#FFFFFF" />
        <Text style={styles.buttonText}>Registrar mi mascota</Text>
      </TouchableOpacity>
    </View>
  );
};
