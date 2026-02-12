import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";

interface SocialButtonProps {
  provider: "google" | "facebook" | "apple";
  onPress: () => void;
  disabled?: boolean;
}

const providerConfig = {
  google: {
    label: "Continuar con Google",
    icon: "G",
  },
  facebook: {
    label: "Continuar con Facebook",
    icon: "F",
  },
  apple: {
    label: "Continuar con Apple",
    icon: "A",
  },
};

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  disabled = true,
}) => {
  const { isDark } = useTheme();
  const config = providerConfig[provider];

  const styles = StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.xl,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      backgroundColor: "transparent",
      opacity: disabled ? 0.6 : 1,
      height: 38,
    },
    iconContainer: {
      width: 24,
      height: 24,
      marginRight: Spacing.md,
      backgroundColor: "#FFFFFF",
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: {
      fontSize: 16,
      fontWeight: Typography.fontWeight.bold,
      color: "#1D2AD8",
    },
    text: {
      color: "#FFFFFF",
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.medium,
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{config.icon}</Text>
      </View>
      <Text style={styles.text}>{config.label}</Text>
    </TouchableOpacity>
  );
};
