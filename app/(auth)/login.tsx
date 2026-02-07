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
import { SocialButton } from "@/components/auth/SocialButton";
import { AuthBackground } from "@/components/auth/AuthBackground";

export default function LoginScreen() {
  console.log("Environment API URL:", process.env.EXPO_PUBLIC_API_URL);

  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const { colors } = useTheme();
  const [showForm, setShowForm] = useState(false);
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

      // El _layout.tsx se encargará de la redirección automáticamente
    } catch (err: any) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setShowForm(false);
    clearError();
    reset(); // Limpiar el formulario y errores
    Keyboard.dismiss(); // Cerrar teclado
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
      // marginBottom: Spacing.md,
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
    logoText: {
      fontSize: 56,
      fontWeight: Typography.fontWeight.bold,
      color: "#FFFFFF",
      letterSpacing: 2,
    },
    pawPrint: {
      fontSize: 40,
      marginLeft: Spacing.sm,
    },

    tagline: {
      fontSize: Typography.fontSize.md,
      color: "#FFFFFF",
      textAlign: "center",
      paddingHorizontal: Spacing.xl,
      lineHeight: 24,
    },
    formContainer: {
      // marginTop: Spacing.xs,
    },
    socialContainer: {
      marginTop: Spacing.xl,
      gap: Spacing.md,
    },
    errorText: {
      color: "#FFFFFF",
      fontSize: Typography.fontSize.sm,
      textAlign: "center",
      marginBottom: Spacing.md,
      backgroundColor: colors.error,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    createAccountContainer: {
      marginTop: Spacing.xl,
      alignItems: "center",
      paddingBottom: Spacing.lg,
    },
    createAccountText: {
      fontSize: Typography.fontSize.md,
      color: "#FFFFFF",
      fontWeight: Typography.fontWeight.semibold,
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
      fontWeight: Typography.fontWeight.semibold,
    },
    keyboardAvoid: {
      flex: 1,
    },
  });

  if (!showForm) {
    // Pantalla inicial con opciones
    return (
      <AuthBackground>
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            style={styles.safeArea}
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
              <Button
                title="Ingresar"
                onPress={() => setShowForm(true)}
                style={styles.loginButton}
                textStyle={styles.loginButtonText}
                fullWidth
              />
            </View>

            <View style={styles.socialContainer}>
              <SocialButton provider="google" onPress={() => {}} disabled />
              <SocialButton provider="facebook" onPress={() => {}} disabled />
              <SocialButton provider="apple" onPress={() => {}} disabled />
            </View>

            <TouchableOpacity
              style={styles.createAccountContainer}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={styles.createAccountText}>Crear cuenta</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </AuthBackground>
    );
  }

  // Formulario de login
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
                  {error && <Text style={styles.errorText}>{error}</Text>}

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
                        variant="auth"
                        type="password"
                        placeholder="contraseña"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.password?.message}
                        returnKeyType="done"
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
