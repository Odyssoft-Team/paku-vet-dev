/**
 * forgot-password.tsx
 *
 * Pantalla "¿Olvidaste tu contraseña?".
 * El usuario ingresa su email → POST /auth/forgot-password
 * El backend siempre responde 200 (no revela si el email existe).
 * Luego el usuario recibe un email con un enlace/token.
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
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

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
});
type FormData = z.infer<typeof schema>;

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    if (isRateLimited) return;
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 429) {
        setIsRateLimited(true);
      } else {
        // El backend siempre responde 200 — cualquier otro error es inesperado
        Alert.alert("Error", "No se pudo enviar el correo. Intenta más tarde.");
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
    content: {
      flex: 1,
      justifyContent: "center",
      paddingVertical: Spacing.xl,
    },
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
    sentBox: {
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      alignItems: "center",
      gap: Spacing.md,
    },
    sentTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFF",
      textAlign: "center",
    },
    sentText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: "rgba(255,255,255,0.8)",
      textAlign: "center",
      lineHeight: 22,
    },
    rateLimitBox: {
      backgroundColor: "rgba(239,68,68,0.2)",
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    rateLimitText: {
      color: "#FCA5A5",
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      textAlign: "center",
    },
    loginLink: {
      alignItems: "center",
      marginTop: Spacing.lg,
    },
    loginLinkText: {
      color: "rgba(255,255,255,0.75)",
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      textDecorationLine: "underline",
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/(auth)/login-form")}
            >
              <Icon name="arrow-back" size={18} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.content}>
              {/* Icono */}
              <View style={styles.iconContainer}>
                <Icon name="close" size={32} color="#FFF" />
              </View>

              <Text style={styles.title}>¿Olvidaste tu{"\n"}contraseña?</Text>

              {!sent ? (
                <>
                  <Text style={styles.subtitle}>
                    Ingresa tu correo y te enviaremos un enlace para restablecer
                    tu contraseña.
                  </Text>

                  {isRateLimited && (
                    <View style={styles.rateLimitBox}>
                      <Text style={styles.rateLimitText}>
                        Demasiadas solicitudes. Espera un momento antes de
                        intentar de nuevo.
                      </Text>
                    </View>
                  )}

                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        variant="auth"
                        type="email"
                        placeholder="correo@gmail.com"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.email?.message}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onSubmit)}
                      />
                    )}
                  />

                  <Button
                    title={isLoading ? "Enviando..." : "Enviar enlace"}
                    onPress={handleSubmit(onSubmit)}
                    loading={isLoading}
                    disabled={isLoading || isRateLimited}
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
                /* Estado: email enviado */
                <View style={styles.sentBox}>
                  <Text style={{ fontSize: 40 }}>📬</Text>
                  <Text style={styles.sentTitle}>¡Correo enviado!</Text>
                  <Text style={styles.sentText}>
                    Si{" "}
                    <Text
                      style={{ fontFamily: Typography.fontFamily.semibold }}
                    >
                      {getValues("email")}
                    </Text>{" "}
                    está registrado, recibirás un enlace para restablecer tu
                    contraseña.{"\n\n"}
                    Revisa también tu carpeta de spam.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push("/(auth)/login-form")}
                activeOpacity={0.7}
              >
                <Text style={styles.loginLinkText}>
                  Volver al inicio de sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
  );
}
