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
import { OptionSelector } from "@/components/common/OptionSelector";
import { YesNoSelector } from "@/components/common/YesNoSelector";
import { useTheme } from "@/hooks/useTheme";
import { petStep3Schema, PetStep3FormData } from "@/utils/validators";
import { Typography, Spacing } from "@/constants/theme";
import { useAddPetStore } from "@/store/addPetStore";
import { ScreenHeader } from "@/components/common/ScreenHeader";

export default function AddPetStep3Screen() {
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
  } = useForm<PetStep3FormData>({
    resolver: zodResolver(petStep3Schema),
    defaultValues: {
      bath_behavior: formData.bath_behavior || undefined,
      tolerates_drying: formData.tolerates_drying || false,
      tolerates_nail_clipping: formData.tolerates_nail_clipping || false,
      vaccines_up_to_date: formData.vaccines_up_to_date || false,
      notes: formData.notes,
    },
  });

  const onContinue = (data: PetStep3FormData) => {
    formData.setStep3Data(data);
    router.push("/(screens)/add-pet-step4");
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
        <Text style={styles.sectionTitle}>Esto nos ayuda a cuidarlo mejor</Text>

        <Controller
          control={control}
          name="bath_behavior"
          render={({ field: { onChange, value } }) => (
            <OptionSelector
              label="¿Cómo se comporta durante el baño?"
              options={[
                { value: "calm", label: "Tranquilo/a" },
                { value: "fearful", label: "Miedoso/a" },
                { value: "anxious", label: "Ansioso/a" },
              ]}
              value={value}
              onSelect={onChange}
              error={errors.bath_behavior?.message}
              columns={3}
            />
          )}
        />

        <Controller
          control={control}
          name="tolerates_drying"
          render={({ field: { onChange, value } }) => (
            <YesNoSelector
              label="¿Tolera bien el secado?"
              value={value}
              onSelect={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="tolerates_nail_clipping"
          render={({ field: { onChange, value } }) => (
            <YesNoSelector
              label="¿Tolera el corte de uñas?"
              value={value}
              onSelect={onChange}
            />
          )}
        />

        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
          Historial preventivo
        </Text>

        <Controller
          control={control}
          name="vaccines_up_to_date"
          render={({ field: { onChange, value } }) => (
            <YesNoSelector
              label="¿Cuenta con vacunas al día?"
              value={value}
              onSelect={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="¿Ha tenido alguna condición médica?"
              placeholder="Si/No especificar"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              returnKeyType="done"
              multiline
              numberOfLines={3}
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
        backHref="/(screens)/add-pet-step2"
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
