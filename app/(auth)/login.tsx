import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { loginSchema, LoginFormData } from '@/utils/validators';
import { Typography, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      clearError();
      await login(data);
      // La redirección se maneja en index.tsx
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.lg,
    },
    title: {
      fontSize: Typography.fontSize.xxxl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
      textAlign: 'center',
    },
    form: {
      marginTop: Spacing.xl,
    },
    errorText: {
      color: colors.error,
      fontSize: Typography.fontSize.sm,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    footerText: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
    },
    linkText: {
      fontSize: Typography.fontSize.sm,
      color: colors.primary,
      fontWeight: Typography.fontWeight.semibold,
      marginLeft: Spacing.xs,
    },
  });

  return (
    <Screen scrollable centered>
      <View style={styles.container}>
        <Text style={styles.title}>PAKU</Text>
        <Text style={styles.subtitle}>Bienvenido de vuelta</Text>

        <View style={styles.form}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Button
            title="Iniciar Sesión"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            fullWidth
            style={{ marginTop: Spacing.md }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta?</Text>
          <Text
            style={styles.linkText}
            onPress={() => router.push('/(auth)/register')}
          >
            Regístrate
          </Text>
        </View>
      </View>
    </Screen>
  );
}
