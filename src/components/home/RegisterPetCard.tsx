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
    title: {
      fontSize: Typography.fontSize.md,
      color: colors.primary,
      marginBottom: Spacing.sm,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary + "20",
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.secondary,
      gap: Spacing.sm,
    },
    buttonText: {
      fontSize: Typography.fontSize.md,
      color: colors.secondary,
    },
  });

  return (
    <View>
      <Text variant="bold" style={styles.title}>
        Empieza registrando a tu mascota
      </Text>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Icon name="plus" size={18} color={colors.secondary} />
        <Text variant="semibold" style={styles.buttonText}>
          Registrar mascota
        </Text>
      </TouchableOpacity>
    </View>
  );
};
