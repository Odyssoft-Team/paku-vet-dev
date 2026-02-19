import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { Icon, IconName } from "../common";

interface SocialButtonProps {
  icon: IconName;
  label: string;
  sizeIcon?: number;
  onPress: () => void;
  disabled?: boolean;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  label,
  sizeIcon = 20,
  onPress,
  disabled = true,
}) => {
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
      gap: Spacing.md,
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
    icon: {
      position: "absolute",
      left: Spacing.md,
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={sizeIcon} style={styles.icon} color="#fff" />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};
