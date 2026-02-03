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
import { registerSchema, RegisterFormData } from '@/utils/validators';
import { Typography, Spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, error, clearError } = useAuth();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      clearError();
      
      // Remover confirmPassword antes de enviar
      const { confirmPassword, ...registerData } = data;
      
      await register(registerData);
      // La redirección se maneja en index.tsx
    } catch (err) {
      console.error('Register error:', err);
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
      marginBottom: Spacing.lg,
      textAlign: 'center',
    },
    form: {
      marginTop: Spacing.md,
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
    <Screen scrollable>
      <View style={styles.container}>
        <Text style={styles.title}>PAKU</Text>
        <Text style={styles.subtitle}>Crea tu cuenta</Text>

        <View style={styles.form}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
              />
            )}
          />

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
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Teléfono (opcional)"
                type="phone"
                placeholder="999 999 999"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
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

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title="Registrarse"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            fullWidth
            style={{ marginTop: Spacing.md }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <Text
            style={styles.linkText}
            onPress={() => router.push('/(auth)/login')}
          >
            Inicia sesión
          </Text>
        </View>
      </View>
    </Screen>
  );
}
