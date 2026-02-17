import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Text } from "../common/Text";

interface Address {
  id: string;
  address: string;
  isDefault: boolean;
}

interface AddressDrawerProps {
  visible: boolean;
  onClose: () => void;
  addresses: Address[];
  onSelectAddress: (id: string) => void;
  onAddNew: () => void;
  isLoading?: boolean;
}

export const AddressDrawer: React.FC<AddressDrawerProps> = ({
  visible,
  onClose,
  addresses,
  onSelectAddress,
  onAddNew,
  isLoading = false,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    drawer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
      maxHeight: "100%",
    },
    // handle: {
    //   width: 40,
    //   height: 4,
    //   backgroundColor: colors.border,
    //   borderRadius: 2,
    //   alignSelf: "center",
    //   marginBottom: Spacing.md,
    // },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      // borderBottomWidth: 1,
      // borderBottomColor: colors.border,
    },
    title: {
      fontSize: Typography.fontSize.lg,
      color: colors.primary,
      textAlign: "center",
    },
    addressList: {
      paddingHorizontal: Spacing.lg,
      // paddingTop: Spacing.md,
    },
    addressItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    addressText: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      color: colors.text,
      marginLeft: Spacing.md,
    },
    addressTextSelected: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      color: colors.primary,
      marginLeft: Spacing.md,
    },
    checkIcon: {
      marginLeft: Spacing.sm,
    },
    buttonContainer: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
    },
    loadingContainer: {
      padding: Spacing.xl,
      alignItems: "center",
    },
    emptyContainer: {
      padding: Spacing.xl,
      alignItems: "center",
    },
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    emptyText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.lg,
    },
    addButton: {
      marginTop: Spacing.md,
      marginHorizontal: Spacing.lg,
      flexDirection: "row",
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.secondary + "20",
      borderWidth: 1,
      borderColor: colors.secondary,
      paddingVertical: Spacing.md,
      justifyContent: "center",
      alignItems: "center",
      gap: Spacing.sm,
    },
    addIcon: {
      marginBottom: Spacing.xs,
    },
    addText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
      textAlign: "center",
    },
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (addresses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon
            name="gps"
            size={48}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text variant="regular" style={styles.emptyText}>
            No tienes direcciones guardadas.{"\n"}
            Agrega una para continuar.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        style={styles.addressList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.addressItem}
            onPress={() => {
              onSelectAddress(item.id);
              onClose();
            }}
          >
            <Icon
              name="gps"
              size={20}
              color={item.isDefault ? colors.primary : colors.textSecondary}
            />
            <Text
              variant="regular"
              style={
                item.isDefault ? styles.addressTextSelected : styles.addressText
              }
            >
              {item.address}
            </Text>
            {item.isDefault && (
              <Icon
                name="check"
                size={20}
                color={colors.primary}
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.drawer}>
            <View style={styles.header}>
              <Text variant="bold" style={styles.title}>
                Elige tu dirección
              </Text>
            </View>

            {renderContent()}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                onAddNew();
                onClose();
              }}
            >
              <Icon
                name="plus"
                size={18}
                color={colors.primary}
                style={styles.addIcon}
              />
              <Text style={styles.addText}>Registrar dirección</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
