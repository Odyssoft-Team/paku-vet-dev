import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";

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
    },
    greeting: {
      fontSize: Typography.fontSize.md,
      color: "#FFFFFF",
      marginBottom: Spacing.xs,
    },
    userName: {
      fontWeight: Typography.fontWeight.bold,
    },
    addressButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    address: {
      fontSize: Typography.fontSize.sm,
      color: "#FFFFFF",
      flex: 1,
    },
    iconContainer: {
      padding: Spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Hola, <Text style={styles.userName}>{userName}</Text>
      </Text>
      <TouchableOpacity style={styles.addressButton} onPress={onAddressPress}>
        <Text style={styles.address} numberOfLines={1}>
          {address}
        </Text>
        <View style={styles.iconContainer}>
          <Icon name="arrow-down" size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};
