import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Text } from "@/components/common/Text";
import { Picker } from "@/components/common/Picker";
import { OptionSelector } from "@/components/common/OptionSelector";
import { YesNoSelector } from "@/components/common/YesNoSelector";
import { useTheme } from "@/hooks/useTheme";
import { petStep2Schema, PetStep2FormData } from "@/utils/validators";
import { Typography, Spacing } from "@/constants/theme";
import { useAddPetStore } from "@/store/addPetStore";

export default function AddPetStep2Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const formData = useAddPetStore();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PetStep2FormData>({
    resolver: zodResolver(petStep2Schema),
    defaultValues: {
      size: formData.size || undefined,
      weight_kg: formData.weight_kg,
      activity_level: formData.activity_level || undefined,
      coat_type: formData.coat_type || undefined,
      skin_sensitivity: formData.skin_sensitivity || false,
    },
  });

  const onContinue = (data: PetStep2FormData) => {
    formData.setStep2Data(data);
    router.push("/(screens)/add-pet-step3");
  };

  const handleCancel = () => {
    formData.clearForm();
    router.replace("/(tabs)/(user)");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      marginBottom: insets.bottom,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    backButton: {
      padding: Spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
    },
    cancelButton: {
      padding: Spacing.sm,
    },
    cancelText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFFFFF",
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: 100,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    sectionSubtitle: {
      fontSize: Typography.fontSize.sm,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    fixedButton: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.lg,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registro de mascota</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      {/* Formulario */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Datos para un mejor cuidado</Text>
          <Text variant="bold" style={styles.sectionSubtitle}>
            Tamaño
          </Text>

          {/* Tamaño */}
          <Controller
            control={control}
            name="size"
            render={({ field: { onChange, value } }) => (
              <Picker
                label="Selecciona el tamaño"
                value={value}
                options={[
                  { id: "small", name: "Pequeño (hasta 5 kg)" },
                  { id: "medium", name: "Mediano (5 a 15 kg)" },
                  { id: "large", name: "Grande (25 a 35 kg)" },
                ]}
                placeholder="Selecciona el tamaño"
                onSelect={onChange}
                error={errors.size?.message}
              />
            )}
          />

          {/* Peso */}
          <Controller
            control={control}
            name="weight_kg"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Peso actual (opcional si aún no lo sabes)"
                placeholder="Especificar peso"
                value={value?.toString() || ""}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  onChange(isNaN(num) ? undefined : num);
                }}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                returnKeyType="next"
                colorLabel={colors.primary}
              />
            )}
          />

          {/* Nivel de actividad */}
          <Controller
            control={control}
            name="activity_level"
            render={({ field: { onChange, value } }) => (
              <OptionSelector
                label="Nivel de actividad"
                options={[
                  { value: "low", label: "Bajo" },
                  { value: "medium", label: "Medio" },
                  { value: "high", label: "Alto" },
                ]}
                value={value}
                onSelect={onChange}
                error={errors.activity_level?.message}
                columns={3}
              />
            )}
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
            Adaptamos el servicio a su necesidad real
          </Text>

          {/* Tipo de pelaje */}
          <Controller
            control={control}
            name="coat_type"
            render={({ field: { onChange, value } }) => (
              <OptionSelector
                label="Tipo de pelaje"
                options={[
                  { value: "short", label: "Corto" },
                  { value: "medium", label: "Mediano" },
                  { value: "long", label: "Largo" },
                ]}
                value={value}
                onSelect={onChange}
                error={errors.coat_type?.message}
                columns={3}
              />
            )}
          />

          {/* Sensibilidad de piel */}
          <Controller
            control={control}
            name="skin_sensitivity"
            render={({ field: { onChange, value } }) => (
              <YesNoSelector
                label="¿Presenta sensibilidad de piel?"
                value={value}
                onSelect={onChange}
              />
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Botón Continuar fijo */}
      <View style={styles.fixedButton}>
        <Button
          title="Continuar"
          onPress={handleSubmit(onContinue)}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
