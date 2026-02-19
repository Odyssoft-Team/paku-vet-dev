import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    };

    const sizeStyles: Record<typeof size, ViewStyle> = {
      sm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
      },
      md: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
      },
      lg: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
      },
    };

    const variantStyles: Record<typeof variant, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? colors.disabled : colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? colors.disabled : colors.secondary,
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: disabled ? colors.disabled : colors.primary,
      },
      ghost: {
        backgroundColor: "transparent",
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: "100%" }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<typeof size, TextStyle> = {
      sm: {
        fontSize: Typography.fontSize.sm,
      },
      md: {
        fontSize: Typography.fontSize.md,
      },
      lg: {
        fontSize: Typography.fontSize.lg,
      },
    };

    const variantStyles: Record<typeof variant, TextStyle> = {
      primary: {
        color: "#FFFFFF",
      },
      secondary: {
        color: "#FFFFFF",
      },
      outline: {
        color: disabled ? colors.disabled : colors.primary,
      },
      ghost: {
        color: disabled ? colors.disabled : colors.primary,
      },
    };

    return {
      fontWeight: Typography.fontWeight.semibold,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" || variant === "secondary"
              ? "#FFFFFF"
              : colors.primary
          }
          size="small"
        />
      ) : (
        <Text
          style={[
            getTextStyle(),
            textStyle,
            { includeFontPadding: false, flexShrink: 1 },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
