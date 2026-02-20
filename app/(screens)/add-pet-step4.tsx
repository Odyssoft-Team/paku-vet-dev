import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Text } from "@/components/common/Text";
import { Picker } from "@/components/common/Picker";
import { YesNoSelector } from "@/components/common/YesNoSelector";
import { OptionSelector } from "@/components/common/OptionSelector";
import { useTheme } from "@/hooks/useTheme";
import { petStep4Schema, PetStep4FormData } from "@/utils/validators";
import { Typography, Spacing } from "@/constants/theme";
import { useAddPetStore } from "@/store/addPetStore";
import { usePetStore } from "@/store/petStore";
import { CreatePetData } from "@/types/pet.types";
import { ScreenHeader } from "@/components/common/ScreenHeader";

export default function AddPetStep4Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const formData = useAddPetStore();
  const { createPet } = usePetStore();
  const [saving, setSaving] = useState(false);

  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PetStep4FormData>({
    resolver: zodResolver(petStep4Schema),
    defaultValues: {
      grooming_frequency: formData.grooming_frequency,
      receive_reminders: formData.receive_reminders || false,
      antiparasitic: formData.antiparasitic || false,
      antiparasitic_interval: formData.antiparasitic_interval,
      special_shampoo: formData.special_shampoo || false,
    },
  });

  const antiparasitic = watch("antiparasitic");

  const onFinish = async (data: PetStep4FormData) => {
    try {
      setSaving(true);

      // Guardar datos del paso 4
      formData.setStep4Data(data);

      // Construir el objeto completo para enviar a la API
      const petData: CreatePetData = {
        // Paso 1
        name: formData.name,
        species: formData.species as "dog" | "cat",
        breed: formData.breed,
        sex: formData.sex as "male" | "female",
        birth_date: formData.birth_date,
        sterilized: formData.sterilized,

        // Paso 2
        size: formData.size as "small" | "medium" | "large",
        weight_kg: formData.weight_kg || 0,
        activity_level: formData.activity_level as "low" | "medium" | "high",
        coat_type: formData.coat_type as "short" | "medium" | "long",
        skin_sensitivity: formData.skin_sensitivity,

        // Paso 3
        bath_behavior: formData.bath_behavior as "calm" | "fearful" | "anxious",
        tolerates_drying: formData.tolerates_drying,
        tolerates_nail_clipping: formData.tolerates_nail_clipping,
        vaccines_up_to_date: formData.vaccines_up_to_date,
        notes: formData.notes,

        // Paso 4
        grooming_frequency: data.grooming_frequency,
        receive_reminders: data.receive_reminders,
        antiparasitic: data.antiparasitic,
        antiparasitic_interval: data.antiparasitic_interval,
        special_shampoo: data.special_shampoo,
      };

      // Crear mascota
      await createPet(petData);

      // Limpiar formulario
      formData.clearForm();

      // Mostrar mensaje de éxito
      Alert.alert("Éxito", "Mascota registrada correctamente", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(tabs)/(user)");
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error al guardar mascota:", error);
      Alert.alert(
        "Error",
        error.response?.data?.detail || "No se pudo registrar la mascota",
      );
    } finally {
      setSaving(false);
    }
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
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    sectionSubtitle: {
      fontSize: Typography.fontSize.sm,
      color: colors.primary,
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.secondary,
      width: "100%",
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
      <ScreenHeader
        title="Registro de mascota"
        backHref="/(screens)/add-pet-step3"
        right={{
          type: "text",
          label: "Cancelar",
          onPress: handleCancel,
        }}
      />

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
          {/* <Text variant="medium" style={styles.sectionSubtitle}>
            ¿Cada cuánto recibe grooming?
          </Text> */}

          {/* Frecuencia de grooming */}
          <Controller
            control={control}
            name="grooming_frequency"
            render={({ field: { onChange, value } }) => (
              <Picker
                label="¿Cada cuánto recibe grooming?"
                value={value || ""}
                options={[
                  { id: "every_15_days", name: "Cada 15 días" },
                  { id: "monthly", name: "1 vez al mes" },
                  { id: "occasional", name: "Ocasional" },
                ]}
                placeholder="Selecciona recordatorio"
                onSelect={onChange}
                labelColor={colors.primary}
              />
            )}
          />

          {/* Recordatorios automáticos */}
          <Controller
            control={control}
            name="receive_reminders"
            render={({ field: { onChange, value } }) => (
              <YesNoSelector
                label="¿Deseas recibir recordatorios automáticos?"
                value={value}
                onSelect={onChange}
              />
            )}
          />

          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
            Te recomendaremos solo lo que necesitas
          </Text>

          {/* Antipulgas */}
          <Controller
            control={control}
            name="antiparasitic"
            render={({ field: { onChange, value } }) => (
              <YesNoSelector
                label="¿Usa antipulgas actualmente?"
                value={value}
                onSelect={onChange}
              />
            )}
          />

          {/* Frecuencia de antipulgas - condicional */}
          {antiparasitic && (
            <Controller
              control={control}
              name="antiparasitic_interval"
              render={({ field: { onChange, value } }) => (
                <OptionSelector
                  label="¿Cada cuánto lo aplicas?"
                  options={[
                    { value: "monthly", label: "Mensual" },
                    { value: "trimestral", label: "Trimestral" },
                    // { value: "semestral", label: "Semestral" },
                  ]}
                  value={value || ""}
                  onSelect={onChange}
                  columns={2}
                />
              )}
            />
          )}

          {/* Shampoo especial */}
          <Controller
            control={control}
            name="special_shampoo"
            render={({ field: { onChange, value } }) => (
              <YesNoSelector
                label="¿Usa shampoo especial?"
                value={value}
                onSelect={onChange}
              />
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Botón Guardar fijo */}
      <View style={styles.fixedButton}>
        <Button
          title="Guardar registro"
          onPress={handleSubmit(onFinish)}
          fullWidth
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}
