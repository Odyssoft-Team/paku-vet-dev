/**
 * reset-password.tsx
 *
 * Pantalla para restablecer la contraseña con el token recibido por email.
 * Se llega aquí desde el deep link: paku://reset-password?token=xxx
 *
 * POST /auth/reset-password → { token, new_password }
 * Responde 204 si todo OK → redirigir a login.
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { authService } from "@/api/services/auth.service";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

// ─── Indicador de fortaleza de contraseña ─────────────────────────────────────

function PasswordStrengthIndicator({ password }: { password: string }) {
  const rules = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Al menos una mayúscula", ok: /[A-Z]/.test(password) },
    { label: "Al menos un número", ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <View style={{ marginTop: -8, marginBottom: 12, gap: 4 }}>
      {rules.map((rule) => (
        <View
          key={rule.label}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: rule.ok ? "#10B981" : "rgba(255,255,255,0.3)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {rule.ok && (
              <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "bold" }}>
                ✓
              </Text>
            )}
          </View>
          <Text
            style={{
              fontSize: 12,
              color: rule.ok ? "#10B981" : "rgba(255,255,255,0.6)",
              fontFamily: "System",
            }}
          >
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe tener al menos una letra mayúscula")
      .regex(/[0-9]/, "Debe tener al menos un número"),
    confirm_password: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token ?? "";

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const passwordValue = watch("new_password");

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setServerError(
        "El enlace de recuperación no es válido. Solicita uno nuevo.",
      );
      return;
    }
    setIsLoading(true);
    setServerError(null);
    try {
      await authService.resetPassword(token, data.new_password);
      setSuccess(true);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 400 || status === 422) {
        setServerError("El enlace expiró o no es válido. Solicita uno nuevo.");
      } else {
        setServerError(
          "No se pudo restablecer la contraseña. Intenta más tarde.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: Spacing.lg },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-start",
      position: "absolute",
      top: 0,
      left: Spacing.lg,
      zIndex: 1,
    },
    content: { flex: 1, justifyContent: "center", paddingVertical: Spacing.xl },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFF",
      textAlign: "center",
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: "rgba(255,255,255,0.75)",
      textAlign: "center",
      lineHeight: 22,
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.md,
    },
    errorBox: {
      backgroundColor: "rgba(239,68,68,0.2)",
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    errorText: {
      color: "#FCA5A5",
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      textAlign: "center",
    },
    successBox: {
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      alignItems: "center",
      gap: Spacing.md,
    },
    successTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFF",
      textAlign: "center",
    },
    successText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: "rgba(255,255,255,0.8)",
      textAlign: "center",
      lineHeight: 22,
    },
  });

  return (
    <AuthBackground>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.safeArea}>
            {!success && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Icon name="arrow-back" size={18} color="#FFF" />
              </TouchableOpacity>
            )}

            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Icon
                  name={success ? "check" : "close"}
                  size={32}
                  color="#FFF"
                />
              </View>

              {!success ? (
                <>
                  <Text style={styles.title}>Nueva contraseña</Text>
                  <Text style={styles.subtitle}>
                    Ingresa tu nueva contraseña. Asegúrate de que sea segura.
                  </Text>

                  {serverError && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{serverError}</Text>
                    </View>
                  )}

                  <Controller
                    control={control}
                    name="new_password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <>
                        <Input
                          variant="auth"
                          type="password"
                          placeholder="Nueva contraseña"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={errors.new_password?.message}
                          returnKeyType="next"
                        />
                        <PasswordStrengthIndicator password={value} />
                      </>
                    )}
                  />

                  <Controller
                    control={control}
                    name="confirm_password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        variant="auth"
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.confirm_password?.message}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onSubmit)}
                      />
                    )}
                  />

                  <Button
                    title={
                      isLoading ? "Guardando..." : "Restablecer contraseña"
                    }
                    onPress={handleSubmit(onSubmit)}
                    loading={isLoading}
                    disabled={isLoading}
                    fullWidth
                    style={{
                      borderRadius: BorderRadius.xl,
                      backgroundColor: colors.loginButton,
                      height: 42,
                    }}
                    textStyle={{
                      color: colors.loginButtonText,
                      fontFamily: Typography.fontFamily.semibold,
                    }}
                  />
                </>
              ) : (
                /* Estado: éxito */
                <>
                  <View style={styles.successBox}>
                    <Text style={{ fontSize: 40 }}>✅</Text>
                    <Text style={styles.successTitle}>
                      ¡Contraseña restablecida!
                    </Text>
                    <Text style={styles.successText}>
                      Ya puedes iniciar sesión con tu nueva contraseña.
                    </Text>
                  </View>

                  <Button
                    title="Ir al inicio de sesión"
                    onPress={() => router.push("/(auth)/login-form")}
                    fullWidth
                    style={{
                      marginTop: Spacing.lg,
                      borderRadius: BorderRadius.xl,
                      backgroundColor: colors.loginButton,
                      height: 42,
                    }}
                    textStyle={{
                      color: colors.loginButtonText,
                      fontFamily: Typography.fontFamily.semibold,
                    }}
                  />
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
  );
}
