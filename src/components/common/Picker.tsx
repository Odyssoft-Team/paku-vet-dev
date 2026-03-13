import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { Icon } from "./Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Text } from "./Text";

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

  const selectedOption = options.find((opt) => opt.id === value);

  const handleSelect = (id: string) => {
    onSelect(id);
    setModalVisible(false);
  };

  const styles = StyleSheet.create({
    // ── Trigger ───────────────────────────────────────────────────────────────
    container: {
      marginBottom: Spacing.md,
    },
    label: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
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
      backgroundColor: disabled ? colors.border + "20" : colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      minHeight: 40,
    },
    pickerText: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: selectedOption ? colors.text : colors.textSecondary + "80",
    },
    errorText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.error,
      marginTop: Spacing.xs,
    },

    // ── Overlay ───────────────────────────────────────────────────────────────
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
      alignItems: "center", // centra horizontalmente
    },

    // Wrapper que ocupa todo el ancho y añade márgenes laterales + inferior
    sheetWrapper: {
      width: "100%",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md, // espacio del borde inferior con la pantalla
    },

    // El sheet en sí — bordes redondeados en todos los lados
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      maxHeight: "75%",
      width: "100%", // ocupa el ancho del sheetWrapper (con márgenes)
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        android: { elevation: 16 },
      }),
    },

    // ── Drag handle ───────────────────────────────────────────────────────────
    handleContainer: {
      alignItems: "center",
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border + "60",
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "25",
    },
    headerLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
    },

    // ── Opciones ──────────────────────────────────────────────────────────────
    listContent: {
      paddingVertical: Spacing.xs,
      paddingBottom: Spacing.xl,
    },
    optionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: 15,
      gap: Spacing.md,
    },
    optionItemSelected: {},
    optionCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border + "60",
      alignItems: "center",
      justifyContent: "center",
    },
    optionCheckSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
    },
    optionTextSelected: {
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border + "18",
      marginHorizontal: Spacing.lg,
    },

    // ── Cancelar ──────────────────────────────────────────────────────────────
    cancelRow: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border + "25",
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.border + "18",
    },
    cancelText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => {
          if (!disabled) setModalVisible(true);
        }}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.pickerText}>
          {selectedOption ? selectedOption.name : placeholder}
        </Text>
        <Icon
          name="arrow-down"
          size={18}
          color={disabled ? colors.textSecondary : colors.primary}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.sheetWrapper}
          >
            <View style={styles.sheet}>
              {/* Drag handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerLabel}>Seleccionar</Text>
                <Text style={styles.headerTitle}>{label}</Text>
              </View>

              {/* Opciones */}
              <FlatList
                data={options}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
                renderItem={({ item }) => {
                  const isSelected = item.id === value;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                      onPress={() => handleSelect(item.id)}
                      activeOpacity={0.5}
                    >
                      <View
                        style={[
                          styles.optionCheck,
                          isSelected && styles.optionCheckSelected,
                        ]}
                      >
                        {isSelected && (
                          <Icon name="check" size={12} color="#FFFFFF" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Cancelar */}
              <View style={styles.cancelRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
