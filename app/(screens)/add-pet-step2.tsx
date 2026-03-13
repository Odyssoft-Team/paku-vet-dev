import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
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
import { Text } from "@/components/common/Text";
import { Picker } from "@/components/common/Picker";
import { OptionSelector } from "@/components/common/OptionSelector";
import { YesNoSelector } from "@/components/common/YesNoSelector";
import { useTheme } from "@/hooks/useTheme";
import { petStep2Schema, PetStep2FormData } from "@/utils/validators";
import { Typography, Spacing } from "@/constants/theme";
import { useAddPetStore } from "@/store/addPetStore";
import { ScreenHeader } from "@/components/common/ScreenHeader";

export default function AddPetStep2Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const formData = useAddPetStore();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
    sectionSubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.xs,
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
          name="size"
          render={({ field: { onChange, value } }) => (
            <Picker
              label="Tamaño"
              value={value}
              options={[
                { id: "small", name: "Pequeño (hasta 10 kg)" },
                { id: "medium", name: "Mediano (11 a 25 kg)" },
                { id: "large", name: "Grande (26 a 44 kg)" },
                { id: "big", name: "Gigantes (+45 kg)" },
              ]}
              placeholder="Selecciona el tamaño"
              onSelect={onChange}
              error={errors.size?.message}
            />
          )}
        />

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
            />
          )}
        />

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

      <View style={styles.fixedButton}>
        <Button
          title="Continuar"
          onPress={handleSubmit(onContinue)}
          fullWidth
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Registro de mascota"
        backHref="/(screens)/add-pet-step1"
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
