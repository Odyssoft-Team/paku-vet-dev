import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";

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
}

export const AddressDrawer: React.FC<AddressDrawerProps> = ({
  visible,
  onClose,
  addresses,
  onSelectAddress,
  onAddNew,
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
      maxHeight: "70%",
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: Spacing.md,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary,
      textAlign: "center",
    },
    addressList: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
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
    checkIcon: {
      marginLeft: Spacing.sm,
    },
    buttonContainer: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
    },
  });

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
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Elige tu dirección</Text>
            </View>

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
                    color={
                      item.isDefault ? colors.primary : colors.textSecondary
                    }
                  />
                  <Text style={styles.addressText}>{item.address}</Text>
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

            <View style={styles.buttonContainer}>
              <Button
                title="+ Nueva dirección"
                onPress={() => {
                  onAddNew();
                  onClose();
                }}
                variant="secondary"
                fullWidth
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
