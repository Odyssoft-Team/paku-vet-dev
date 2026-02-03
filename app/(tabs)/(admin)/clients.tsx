import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/theme';

export default function ClientsScreen() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: Typography.fontSize.xxl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
    },
  });

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Clientes</Text>
        {/* Contenido a desarrollar */}
      </View>
    </Screen>
  );
}
