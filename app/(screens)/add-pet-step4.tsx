import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
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
import { Text } from "@/components/common/Text";
import { Picker } from "@/components/common/Picker";
import { YesNoSelector } from "@/components/common/YesNoSelector";
import { OptionSelector } from "@/components/common/OptionSelector";
import { useTheme } from "@/hooks/useTheme";
import { petStep4Schema, PetStep4FormData } from "@/utils/validators";
import { Typography, Spacing } from "@/constants/theme";
import { useAddPetStore } from "@/store/addPetStore";
import { usePetStore } from "@/store/petStore";
import { useUploadPhoto } from "@/hooks/useUploadPhoto";
import { CreatePetData } from "@/types/pet.types";
import { ScreenHeader } from "@/components/common/ScreenHeader";

export default function AddPetStep4Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const formData = useAddPetStore();
  const { createPet, updatePetPhoto } = usePetStore();
  const { uploadPhoto, isUploading } = useUploadPhoto();
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const insets = useSafeAreaInsets();

  // Android: listener manual para evitar el hueco residual del KAV
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

      formData.setStep4Data(data);

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

      const newPet = await createPet(petData);

      // Subir foto si el usuario seleccionó una en el paso 1
      if (formData.photo_url && newPet?.id) {
        try {
          const { readUrl } = await uploadPhoto(
            "pet",
            newPet.id,
            formData.photo_url,
            formData.photo_mime_type,
          );
          updatePetPhoto(newPet.id, readUrl);
        } catch (photoError) {
          console.log("Error subiendo foto de mascota:", photoError);
        }
      }

      formData.clearForm();

      Alert.alert("Éxito", "Mascota registrada correctamente", [
        { text: "OK", onPress: () => router.replace("/(tabs)/(user)") },
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
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.sm,
    },
    fixedButton: {
      padding: Spacing.lg,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

  const formContent = (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Datos para un mejor cuidado</Text>

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
                ]}
                value={value || ""}
                onSelect={onChange}
                columns={2}
              />
            )}
          />
        )}

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

      <View style={styles.fixedButton}>
        <Button
          title="Guardar registro"
          onPress={handleSubmit(onFinish)}
          fullWidth
          loading={saving || isUploading}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Registro de mascota"
        backHref="/(screens)/add-pet-step3"
        right={{ type: "text", label: "Cancelar", onPress: handleCancel }}
      />
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {formContent}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
          {formContent}
        </View>
      )}
    </SafeAreaView>
  );
}
