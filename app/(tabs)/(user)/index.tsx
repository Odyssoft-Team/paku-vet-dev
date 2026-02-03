import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const { colors, toggleColorScheme, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: Typography.fontSize.xxl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
    },
    roleTag: {
      backgroundColor: colors.info,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginBottom: Spacing.lg,
    },
    roleText: {
      color: '#FFFFFF',
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
  });

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Mi Espacio</Text>
        <Text style={styles.subtitle}>Bienvenido, {user?.name}</Text>

        <View style={styles.roleTag}>
          <Text style={styles.roleText}>CLIENTE</Text>
        </View>

        <Button
          title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          onPress={toggleColorScheme}
          variant="outline"
          style={{ marginBottom: Spacing.md }}
        />

        <Button
          title="Cerrar Sesión"
          onPress={logout}
          variant="outline"
        />
      </View>
    </Screen>
  );
}
