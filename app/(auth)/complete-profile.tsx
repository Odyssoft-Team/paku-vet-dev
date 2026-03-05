import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { DatePicker } from "@/components/common/DatePicker";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { CompleteProfileData } from "@/types/auth.types";

const schema = z.object({
  phone: z
    .string()
    .min(9, "Ingresa un número válido")
    .regex(/^\+?[\d\s\-]+$/, "Formato inválido"),
  sex: z.enum(["male", "female", "other"] as const, {
    required_error: "Selecciona tu género",
  }),
  birth_date: z.date({ required_error: "Selecciona tu fecha de nacimiento" }),
  dni: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SEX_OPTIONS: { label: string; value: FormData["sex"]; icon: string }[] = [
  { label: "Masculino", value: "male", icon: "male" },
  { label: "Femenino", value: "female", icon: "female" },
];

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { completeProfile, isLoading } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", dni: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const birthDateStr = data.birth_date.toISOString().split("T")[0];
      const payload: CompleteProfileData = {
        phone: data.phone,
        sex: data.sex,
        birth_date: birthDateStr,
        ...(data.dni ? { dni: data.dni } : {}),
      };
      await completeProfile(payload);
      router.replace("/(tabs)/(user)");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo completar el perfil. Intenta de nuevo.",
      );
    }
  };

  const AUTH = {
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.7)",
    inputBg: "rgba(255,255,255,0.12)",
    inputBorder: "rgba(255,255,255,0.35)",
    error: "#FFB3B3",
    optionBg: "rgba(255,255,255,0.12)",
    optionBgSelected: "#FFFFFF",
    optionBorder: "rgba(255,255,255,0.35)",
    optionBorderSelected: "#FFFFFF",
    optionText: "#FFFFFF",
    optionTextSelected: colors.primary,
  };

  const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
    },

    // Header — más espacio arriba como el login
    header: {
      alignItems: "center",
      paddingTop: Spacing.xl * 2,
      paddingBottom: Spacing.xl * 1.5,
    },
    title: {
      fontSize: 32,
      fontFamily: Typography.fontFamily.bold,
      color: AUTH.text,
      textAlign: "center",
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: AUTH.textMuted,
      textAlign: "center",
      lineHeight: 24,
    },

    // Campos
    fieldWrapper: {
      marginBottom: Spacing.lg,
    },
    sectionLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: AUTH.text,
      marginBottom: Spacing.xs + 2,
    },

    // Selector de género
    sexRow: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    sexOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      paddingVertical: 14,
      borderRadius: BorderRadius.full,
      borderWidth: 1.5,
      borderColor: AUTH.optionBorder,
      backgroundColor: AUTH.optionBg,
    },
    sexOptionSelected: {
      borderColor: AUTH.optionBorderSelected,
      backgroundColor: AUTH.optionBgSelected,
    },
    sexOptionText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: AUTH.optionText,
    },
    sexOptionTextSelected: {
      color: AUTH.optionTextSelected,
    },

    // Error
    errorText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: AUTH.error,
      marginTop: 4,
    },

    // Botón — igual al login
    submitButton: {
      backgroundColor: colors.loginButton,
      borderRadius: BorderRadius.full,
      height: 52,
      marginTop: Spacing.sm,
    },
    submitButtonText: {
      color: colors.primary,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
    },
  });

  return (
    <AuthBackground>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Completa tu perfil</Text>
              <Text style={styles.subtitle}>
                Necesitamos algunos datos más{"\n"}para poder atender a tu
                mascota.
              </Text>
            </View>

            {/* Teléfono */}
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldWrapper}>
                  <Text style={styles.sectionLabel}>Teléfono</Text>
                  <Input
                    placeholder="+51 987 654 321"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    error={errors.phone?.message}
                    variant="auth"
                  />
                </View>
              )}
            />

            {/* Género */}
            <Controller
              control={control}
              name="sex"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldWrapper}>
                  <Text style={styles.sectionLabel}>Género</Text>
                  <View style={styles.sexRow}>
                    {SEX_OPTIONS.map((opt) => {
                      const selected = value === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.sexOption,
                            selected && styles.sexOptionSelected,
                          ]}
                          onPress={() => onChange(opt.value)}
                          activeOpacity={0.75}
                        >
                          <Icon
                            name={opt.icon as any}
                            size={18}
                            color={selected ? colors.primary : "#FFFFFF"}
                          />
                          <Text
                            style={[
                              styles.sexOptionText,
                              selected && styles.sexOptionTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {errors.sex && (
                    <Text style={styles.errorText}>{errors.sex.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Fecha de nacimiento */}
            <Controller
              control={control}
              name="birth_date"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldWrapper}>
                  <Text style={styles.sectionLabel}>Fecha de nacimiento</Text>
                  <DatePicker
                    value={value ?? null}
                    onChange={onChange}
                    error={errors.birth_date?.message}
                    placeholder="Selecciona tu fecha de nacimiento"
                    authStyle
                  />
                </View>
              )}
            />

            {/* DNI (opcional) */}
            <Controller
              control={control}
              name="dni"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldWrapper}>
                  <Text style={styles.sectionLabel}>DNI (opcional)</Text>
                  <Input
                    placeholder="12345678"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    error={errors.dni?.message}
                    variant="auth"
                  />
                </View>
              )}
            />

            {/* Botón */}
            <Button
              title="Guardar y continuar"
              onPress={handleSubmit(onSubmit)}
              // loading={isLoading}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
              fullWidth
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
  );
}
