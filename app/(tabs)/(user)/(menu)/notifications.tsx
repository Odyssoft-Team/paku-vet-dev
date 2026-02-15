import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";

export default function NotificationsScreen() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.lg,
    },
    title: {
      fontSize: Typography.fontSize.xxl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: Spacing.md,
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Notificaciones</Text>
      <Text style={styles.subtitle}>Aquí verás todas tus notificaciones</Text>
    </SafeAreaView>
  );
}
