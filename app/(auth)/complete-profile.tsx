import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Text } from "@/components/common/Text";
import { DatePicker } from "@/components/common/DatePicker";
import { GenderSelector } from "@/components/common/GenderSelector";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { CompleteProfileData, UserSex } from "@/types/auth.types";

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
      // Convertir Date a string "YYYY-MM-DD" para el backend
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
    submitButton: {
      marginTop: Spacing.lg,
      borderRadius: BorderRadius.xl,
      height: 48,
      backgroundColor: "#FFFFFF",
    },
    submitButtonText: {
      color: colors.primary,
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

            {/* Género — usa GenderSelector existente */}
            <Controller
              control={control}
              name="sex"
              render={({ field: { onChange, value } }) => (
                <GenderSelector
                  value={value ?? null}
                  onChange={(val: UserSex) => onChange(val)}
                  error={errors.sex?.message}
                />
              )}
            />

            {/* Fecha de nacimiento — usa DatePicker existente */}
            <Controller
              control={control}
              name="birth_date"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  label="Fecha de nacimiento"
                  value={value ?? null}
                  onChange={onChange}
                  error={errors.birth_date?.message}
                  placeholder="Selecciona tu fecha de nacimiento"
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
