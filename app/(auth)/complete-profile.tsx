import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
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
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: YYYY-MM-DD"),
  dni: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SEX_OPTIONS: { label: string; value: FormData["sex"] }[] = [
  { label: "Masculino", value: "male" },
  { label: "Femenino", value: "female" },
  { label: "Otro", value: "other" },
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
    defaultValues: { phone: "", birth_date: "", dni: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload: CompleteProfileData = {
        phone: data.phone,
        sex: data.sex,
        birth_date: data.birth_date,
        ...(data.dni ? { dni: data.dni } : {}),
      };
      await completeProfile(payload);
      // El store ya actualiza tokens y usuario — redirigir a home
      router.replace("/(tabs)/(user)");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo completar el perfil. Intenta de nuevo.",
      );
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: Spacing.lg },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingVertical: Spacing.xl,
    },
    header: { marginBottom: Spacing.xl, alignItems: "center" },
    title: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: "#FFFFFF",
      textAlign: "center",
      opacity: 0.85,
      lineHeight: 20,
    },
    form: { gap: Spacing.md },
    label: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: "#FFFFFF",
      marginBottom: Spacing.xs,
    },
    sexContainer: { flexDirection: "row", gap: Spacing.sm },
    sexOption: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      alignItems: "center",
    },
    sexOptionSelected: { backgroundColor: "#FFFFFF" },
    sexOptionText: {
      color: "#FFFFFF",
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
    },
    sexOptionTextSelected: { color: colors.primary || "#6C47FF" },
    errorText: {
      fontSize: Typography.fontSize.xs,
      color: "#FFB3B3",
      marginTop: 2,
    },
    submitButton: {
      marginTop: Spacing.lg,
      borderRadius: BorderRadius.xl,
      height: 48,
      backgroundColor: "#FFFFFF",
    },
    submitButtonText: {
      color: colors.primary || "#6C47FF",
      fontFamily: Typography.fontFamily.semibold,
      fontSize: Typography.fontSize.md,
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
          <View style={styles.header}>
            <Text style={styles.title}>Completa tu perfil</Text>
            <Text style={styles.subtitle}>
              Necesitamos algunos datos más{"\n"}para poder atender a tu
              mascota.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Teléfono */}
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Teléfono"
                  placeholder="+51 987 654 321"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  error={errors.phone?.message}
                />
              )}
            />

            {/* Género */}
            <View>
              <Text style={styles.label}>Género</Text>
              <Controller
                control={control}
                name="sex"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.sexContainer}>
                    {SEX_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.sexOption,
                          value === opt.value && styles.sexOptionSelected,
                        ]}
                        onPress={() => onChange(opt.value)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.sexOptionText,
                            value === opt.value && styles.sexOptionTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {errors.sex && (
                <Text style={styles.errorText}>{errors.sex.message}</Text>
              )}
            </View>

            {/* Fecha de nacimiento */}
            <Controller
              control={control}
              name="birth_date"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Fecha de nacimiento"
                  placeholder="1995-06-15"
                  value={value}
                  onChangeText={onChange}
                  error={errors.birth_date?.message}
                />
              )}
            />

            {/* DNI (opcional) */}
            <Controller
              control={control}
              name="dni"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="DNI (opcional)"
                  placeholder="12345678"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={errors.dni?.message}
                />
              )}
            />

            <Button
              title="Guardar y continuar"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
              fullWidth
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthBackground>
  );
}
