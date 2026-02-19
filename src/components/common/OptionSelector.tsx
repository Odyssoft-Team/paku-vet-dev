import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

interface Option {
  value: string;
  label: string;
}

interface OptionSelectorProps {
  label?: string;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  error?: string;
  columns?: 2 | 3; // Número de columnas
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({
  label,
  options,
  value,
  onSelect,
  error,
  columns = 2,
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
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    option: {
      flex: columns === 2 ? 0.48 : 0.31,
      paddingVertical: 10,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      includeFontPadding: false,
    },
    optionSelected: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    optionText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      textAlign: "center",
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
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onSelect(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
