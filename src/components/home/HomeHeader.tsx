import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";
import { Text } from "../common/Text";

interface HomeHeaderProps {
  userName: string;
  address: string;
  onAddressPress: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  address,
  onAddressPress,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      justifyContent: "space-between",
      flexDirection: "row",
      alignItems: "center",
    },
    greeting: {
      fontSize: Typography.fontSize.md,
      color: "#FFFFFF",
    },
    addressButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xl,
    },
    address: {
      fontSize: Typography.fontSize.sm,
      color: "#FFFFFF",
    },
    iconContainer: {
      padding: Spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addressButton} onPress={onAddressPress}>
        <View>
          <Text variant="regular" style={styles.greeting}>
            Hola, <Text variant="medium">{userName}</Text>
          </Text>
          <Text variant="regular" style={styles.address} numberOfLines={1}>
            {address}
          </Text>
        </View>
        <View style={styles.iconContainer}>
          <Icon name="arrow-down" size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity>
        <Icon name="cart" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};
