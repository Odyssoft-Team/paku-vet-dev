import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { SocialButton } from "@/components/auth/SocialButton";
import { AuthBackground } from "@/components/auth/AuthBackground";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
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
    socialContainer: {
      marginTop: Spacing.xl,
      gap: Spacing.md,
    },
    createAccountContainer: {
      marginTop: Spacing.xl,
      alignItems: "center",
      paddingBottom: Spacing.lg,
    },
    createAccountText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFFFFF",
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
  });

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
              onPress={() => router.push("/(auth)/login-form")}
              style={styles.loginButton}
              textStyle={styles.loginButtonText}
              fullWidth
            />
          </View>

          <View style={styles.socialContainer}>
            <SocialButton
              icon="google"
              label="Continuar con Google"
              onPress={() => {}}
              disabled
            />
            <SocialButton
              icon="facebook-2"
              label="Continuar con Facebook"
              sizeIcon={26}
              onPress={() => {}}
              disabled
            />
            <SocialButton
              icon="apple"
              label="Continuar con Apple"
              sizeIcon={24}
              onPress={() => {}}
              disabled
            />
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
