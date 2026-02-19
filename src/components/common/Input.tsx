import React, { useState, forwardRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { Icon, IconName } from "./Icon";
import { Text } from "./Text";

interface InputProps extends TextInputProps {
  label?: string;
  colorLabel?: string;
  error?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  containerStyle?: ViewStyle;
  type?: "text" | "password" | "email" | "phone";
  variant?: "default" | "auth" | "register";
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      colorLabel,
      error,
      leftIcon,
      rightIcon,
      containerStyle,
      type = "text",
      variant = "default",
      ...textInputProps
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const getKeyboardType = () => {
      switch (type) {
        case "email":
          return "email-address";
        case "phone":
          return "phone-pad";
        default:
          return "default";
      }
    };

    const styles = StyleSheet.create({
      container: {
        marginBottom: Spacing.sm,
      },
      label: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.medium,
        fontWeight: Typography.fontWeight.medium,
        color: colorLabel || colors.text,
        marginBottom: Spacing.xs,
      },
      inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor:
          variant === "auth"
            ? colors.loginInputBorder
            : error
              ? colors.error
              : isFocused
                ? colors.primary
                : colors.border,
        borderRadius: variant === "auth" ? BorderRadius.xl : BorderRadius.md,
        backgroundColor:
          variant === "auth" ? colors.loginInput : colors.surface,
        paddingHorizontal: Spacing.md,
        minHeight: 44,
      },
      input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
        color: variant === "auth" ? colors.loginInputText : colors.text,
        // Garantiza centrado vertical en Android
        textAlignVertical: "center",
        includeFontPadding: false,
      },
      iconContainer: {
        marginHorizontal: Spacing.xs,
      },
      errorText: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.regular,
        color: colors.error,
        marginTop: Spacing.xs,
      },
      passwordToggle: {
        padding: Spacing.xs,
      },
    });

    return (
      <View style={[styles.container, containerStyle]}>
        {label && variant === "default" && (
          <Text variant="medium" style={styles.label}>
            {label}
          </Text>
        )}

        <View style={styles.inputContainer}>
          {leftIcon && (
            <View style={styles.iconContainer}>
              <Icon name={leftIcon} size={18} color={colors.textSecondary} />
            </View>
          )}

          <TextInput
            ref={ref}
            style={styles.input}
            placeholderTextColor={colors.placeholder}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={type === "password" && !isPasswordVisible}
            keyboardType={getKeyboardType()}
            autoCapitalize={type === "email" ? "none" : "sentences"}
            {...textInputProps}
          />

          {type === "password" && (
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={isPasswordVisible ? "eye-open" : "eye-closed"}
                size={20}
                color={
                  variant === "auth"
                    ? "#FFFFFF"
                    : variant === "register"
                      ? colors.primary + "80"
                      : colors.textSecondary
                }
              />
            </TouchableOpacity>
          )}

          {rightIcon && type !== "password" && (
            <View style={styles.iconContainer}>
              <Icon name={rightIcon} size={18} color={colors.textSecondary} />
            </View>
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
);

Input.displayName = "Input";
