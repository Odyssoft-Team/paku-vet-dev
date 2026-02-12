import React, { useState, useEffect } from "react";
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
import { AvatarPicker } from "@/components/common/AvatarPicker";
import { OptionSelector } from "@/components/common/OptionSelector";
import { YesNoSelector } from "@/components/common/YesNoSelector";
import { DatePicker } from "@/components/common/DatePicker";
import { useTheme } from "@/hooks/useTheme";
import { petStep1Schema, PetStep1FormData } from "@/utils/validators";
import { Typography, Spacing } from "@/constants/theme";
import { useAddPetStore } from "@/store/addPetStore";

export default function AddPetStep1Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const formData = useAddPetStore();

  const insets = useSafeAreaInsets();

  const [photoUri, setPhotoUri] = useState<string | undefined>(
    formData.photo_url,
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PetStep1FormData>({
    resolver: zodResolver(petStep1Schema),
    defaultValues: {
      name: formData.name || "",
      species: formData.species || undefined,
      breed: formData.breed || "",
      sex: formData.sex || undefined,
      birth_date: formData.birth_date || "",
      sterilized: formData.sterilized || false,
      photo_url: formData.photo_url,
    },
  });

  const species = watch("species");

  const onContinue = (data: PetStep1FormData) => {
    // Guardar datos en el store
    formData.setStep1Data({
      ...data,
      photo_url: photoUri,
    });

    // Navegar al paso 2
    router.push("/(screens)/add-pet-step2");
  };

  const handleCancel = () => {
    formData.clearForm();
    router.back();
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
      marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginBottom: Spacing.lg,
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: Spacing.xl,
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
          {/* Foto */}
          <View style={styles.avatarContainer}>
            <AvatarPicker
              imageUri={photoUri || null}
              onImageSelected={(uri) => {
                setPhotoUri(uri);
                setValue("photo_url", uri);
              }}
            />
          </View>

          <Text style={styles.sectionTitle}>Conozcamos a tu mascota</Text>

          {/* Nombre */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nombre de tu mascota"
                placeholder="Nombre completo"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                returnKeyType="next"
                colorLabel={colors.primary}
              />
            )}
          />

          {/* Especie */}
          <Controller
            control={control}
            name="species"
            render={({ field: { onChange, value } }) => (
              <OptionSelector
                label="Especie"
                options={[
                  { value: "dog", label: "Perro" },
                  { value: "cat", label: "Gato" },
                ]}
                value={value}
                onSelect={onChange}
                error={errors.species?.message}
              />
            )}
          />

          {/* Raza */}
          <Controller
            control={control}
            name="breed"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Raza"
                placeholder="Especificar raza"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.breed?.message}
                returnKeyType="next"
                colorLabel={colors.primary}
              />
            )}
          />

          {/* Sexo */}
          <Controller
            control={control}
            name="sex"
            render={({ field: { onChange, value } }) => (
              <OptionSelector
                label="Sexo"
                options={[
                  { value: "female", label: "Hembra" },
                  { value: "male", label: "Macho" },
                ]}
                value={value}
                onSelect={onChange}
                error={errors.sex?.message}
              />
            )}
          />

          {/* Fecha de nacimiento */}
          <Controller
            control={control}
            name="birth_date"
            render={({ field: { onChange } }) => (
              <DatePicker
                label="Fecha de nacimiento"
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  onChange(date.toISOString().split("T")[0]);
                }}
                error={errors.birth_date?.message}
              />
            )}
          />

          {/* Esterilizado */}
          <Controller
            control={control}
            name="sterilized"
            render={({ field: { onChange, value } }) => (
              <YesNoSelector
                label="¿Está esterilizado/a?"
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
