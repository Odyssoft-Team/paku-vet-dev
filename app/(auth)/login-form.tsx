import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { loginSchema, LoginFormData } from "@/utils/validators";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { AuthBackground } from "@/components/auth/AuthBackground";

export default function LoginFormScreen() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      clearError();

      await login(data);

      // Login exitoso - el _layout.tsx se encargará de la redirección
    } catch (err: any) {
      console.log("Login error:", err);
      // El error se muestra automáticamente del store
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    clearError();
    reset();
    Keyboard.dismiss();
    // router.back();
    router.push("/(auth)/login");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
    },
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
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingVertical: Spacing.xl,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: Spacing.lg,
    },
    logoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    logo: {
      width: 260,
      height: 160,
      resizeMode: "contain",
    },
    tagline: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: "#FFFFFF",
      textAlign: "center",
      paddingHorizontal: Spacing.xl,
      lineHeight: 24,
    },
    formContainer: {
      marginTop: Spacing.md,
    },
    errorText: {
      color: "#FFFFFF",
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      textAlign: "center",
      marginBottom: Spacing.md,
      backgroundColor: colors.error,
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    loginButton: {
      backgroundColor: colors.loginButton,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.sm,
      height: 38,
    },
    loginButtonText: {
      color: colors.loginButtonText,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
    },
    keyboardAvoid: {
      flex: 1,
    },
  });

  return (
    <AuthBackground>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.safeArea}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
              >
                <Icon name="arrow-back" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.logoContainer}>
                  <View style={styles.logoRow}>
                    <Image
                      source={require("@assets/images/logo/logo-mono-dark.png")}
                      style={styles.logo}
                    />
                  </View>
                  <Text style={styles.tagline}>
                    Todo lo que tu mascota necesita,{"\n"}cuando lo necesita.
                  </Text>
                </View>

                <View style={styles.formContainer}>
                  {error && (
                    <Text style={styles.errorText}>
                      {error === "Invalid credentials"
                        ? "Correo o contraseña incorrectos"
                        : "Error al iniciar sesión"}
                    </Text>
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
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          passwordInputRef.current?.focus()
                        }
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        ref={passwordInputRef}
                        variant="auth"
                        type="password"
                        placeholder="contraseña"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.password?.message}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onSubmit)}
                      />
                    )}
                  />

                  <Button
                    title="Ingresar"
                    onPress={handleSubmit(onSubmit)}
                    loading={isLoading}
                    style={styles.loginButton}
                    textStyle={styles.loginButtonText}
                    fullWidth
                  />
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
  );
}
