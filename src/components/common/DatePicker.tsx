import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
  paddingVertical?: number;
  /** Modo auth: estilos blancos sobre fondo azul (pantallas de login/register) */
  authStyle?: boolean;
  variant?: "default" | "auth";
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = "Selecciona una fecha",
  paddingVertical,
  authStyle = false,
  variant = "default",
}) => {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return placeholder;
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Colores según el modo
  const C = authStyle
    ? {
        label: "#FFFFFF",
        inputBg: "rgba(255,255,255,0.12)",
        inputBorder: error ? "#FFFFFF" : "rgba(255,255,255,0.35)",
        dateText: value ? "#FFFFFF" : "rgba(255,255,255,0.5)",
        icon: "rgba(255,255,255,0.6)",
        error: colors.error,
      }
    : {
        label: colors.primary,
        inputBg: colors.surface,
        inputBorder: error ? colors.error : colors.border,
        dateText: value ? colors.text : "#66666660",
        icon: colors.primary + "80",
        error: colors.error,
      };

  const styles = StyleSheet.create({
    container: {
      marginBottom: authStyle ? 0 : Spacing.md,
    },
    label: {
      fontSize: Typography.fontSize.sm, // ← igual que Input
      fontFamily: Typography.fontFamily.semibold,
      color: C.label,
      marginBottom: Spacing.xs,
      fontWeight: Typography.fontWeight.bold,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: authStyle ? 1 : 1,
      borderColor: C.inputBorder,
      borderRadius: variant === "auth" ? BorderRadius.xl : BorderRadius.md,
      backgroundColor: C.inputBg,
      paddingHorizontal: Spacing.md,
      paddingVertical: paddingVertical ?? 11,
    },
    dateText: {
      flex: 1,
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: C.dateText,
    },
    iconContainer: {
      marginLeft: Spacing.sm,
    },
    errorText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: C.error,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dateText}>{formatDate(value)}</Text>
        <View style={styles.iconContainer}>
          <Icon name="calendar" size={20} color={C.icon} />
        </View>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={show}
        mode="date"
        date={value || new Date(2000, 0, 1)}
        maximumDate={new Date()}
        onConfirm={(date) => {
          setShow(false);
          onChange(date);
        }}
        onCancel={() => setShow(false)}
        locale="es_ES"
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
