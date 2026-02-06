import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { colors } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: Spacing.lg,
    },
    header: {
      alignItems: "center",
      marginBottom: Spacing.xxl,
      paddingTop: Spacing.xl,
    },
    title: {
      fontSize: Typography.fontSize.xxl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: Spacing.sm,
    },
    email: {
      fontSize: Typography.fontSize.md,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.xl,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
        {user && (
          <>
            <Text style={styles.email}>
              {user.first_name} {user.last_name}
            </Text>
            <Text style={styles.email}>{user.email}</Text>
          </>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Aquí podrás ver y editar tu información personal
        </Text>

        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="outline"
        />
      </View>
    </SafeAreaView>
  );
}
