import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { Picker as RNPicker } from "@react-native-picker/picker";
import { Icon } from "./Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

interface PickerOption {
  id: string;
  name: string;
}

interface PickerProps {
  label: string;
  labelColor?: string;
  value: string;
  options: PickerOption[];
  placeholder?: string;
  onSelect: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  labelColor,
  value,
  options,
  placeholder = "Seleccionar...",
  onSelect,
  error,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const selectedOption = options.find((opt) => opt.id === value);

  const handleConfirm = () => {
    onSelect(tempValue);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setModalVisible(false);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: Spacing.md,
    },
    label: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: labelColor || colors.primary,
      marginBottom: Spacing.xs,
    },
    pickerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      borderRadius: BorderRadius.md,
      backgroundColor: disabled ? colors.border + "40" : colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      minHeight: 48,
    },
    pickerText: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: selectedOption ? colors.text : colors.placeholder,
    },
    errorText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.error,
      marginTop: Spacing.xs,
    },
    // Modal styles para iOS
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.text,
    },
    modalButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    modalButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
    },
    pickerContainer: {
      backgroundColor: colors.surface,
    },
    // Android picker (inline)
    androidPickerContainer: {
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      borderRadius: BorderRadius.md,
      backgroundColor: disabled ? colors.border + "40" : colors.surface,
      overflow: "hidden",
      paddingLeft: Spacing.sm,
    },
    androidPicker: {
      color: colors.text,
    },
  });

  // En Android, usar el picker directamente (sin modal)
  if (Platform.OS === "android") {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.androidPickerContainer}>
          <RNPicker
            selectedValue={value}
            onValueChange={(itemValue) => onSelect(itemValue as string)}
            enabled={!disabled}
            style={styles.androidPicker}
            dropdownIconColor={colors.primary}
          >
            {/* AGREGAR ESTO: Item inicial para que no tome el primero de la lista */}
            <RNPicker.Item
              label={placeholder}
              value={null} // O "" según cómo manejes tus datos
              color={colors.placeholder}
            />
            {options.map((option) => (
              <RNPicker.Item
                key={option.id}
                label={option.name}
                value={option.id}
                color={colors.text}
              />
            ))}
          </RNPicker>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // En iOS, usar modal con picker tipo rueda
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => {
          if (!disabled) {
            setTempValue(value);
            setModalVisible(true);
          }
        }}
        disabled={disabled}
      >
        <Text style={styles.pickerText}>
          {selectedOption ? selectedOption.name : placeholder}
        </Text>
        <Icon
          name="arrow-down"
          size={20}
          color={disabled ? colors.textSecondary : colors.primary}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Modal para iOS */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.overlay} onPress={handleCancel}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleConfirm}
                >
                  <Text style={styles.modalButtonText}>Listo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={tempValue}
                  onValueChange={(itemValue) =>
                    setTempValue(itemValue as string)
                  }
                  style={{ backgroundColor: colors.surface }}
                  itemStyle={{
                    color: colors.text,
                    fontFamily: Typography.fontFamily.regular,
                  }}
                >
                  <RNPicker.Item
                    label={placeholder}
                    value={placeholder}
                    color={colors.placeholder}
                  />
                  {options.map((option) => (
                    <RNPicker.Item
                      key={option.id}
                      label={option.name}
                      value={option.id}
                      color={colors.text}
                    />
                  ))}
                </RNPicker>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
