import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

interface YesNoSelectorProps {
  label: string;
  value: boolean;
  onSelect: (value: boolean) => void;
  error?: string;
}

export const YesNoSelector: React.FC<YesNoSelectorProps> = ({
  label,
  value,
  onSelect,
  error,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: Spacing.md,
    },
    label: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    optionsContainer: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    option: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
    },
    optionSelected: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    optionText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
    },
    optionTextSelected: {
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
    },
    errorText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.error,
      marginTop: Spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.option, value === true && styles.optionSelected]}
          onPress={() => onSelect(true)}
        >
          <Text
            style={[
              styles.optionText,
              value === true && styles.optionTextSelected,
            ]}
          >
            Sí
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, value === false && styles.optionSelected]}
          onPress={() => onSelect(false)}
        >
          <Text
            style={[
              styles.optionText,
              value === false && styles.optionTextSelected,
            ]}
          >
            No
          </Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
