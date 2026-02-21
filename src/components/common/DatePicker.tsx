import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

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
  fontWeight?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = "Selecciona una fecha",
  paddingVertical,
  fontWeight,
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

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: Spacing.md,
    },
    label: {
      // fontSize: Typography.fontSize.md,
      color: colors.primary,
      marginBottom: Spacing.xs,
      fontWeight: fontWeight || Typography.fontWeight.semibold,
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: paddingVertical || 10,
    },
    dateText: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      color: value ? colors.text : colors.placeholder,
    },
    iconContainer: {
      marginLeft: Spacing.sm,
    },
    errorText: {
      fontSize: Typography.fontSize.xs,
      color: colors.error,
      marginTop: Spacing.xs,
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
          <Icon name="calendar" size={20} color={colors.primary + "80"} />
        </View>
      </TouchableOpacity>

      {/* {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          maximumDate={new Date()}
        />
      )} */}

      {show && (
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
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
