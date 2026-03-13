import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
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
import { AvatarPicker } from "@/components/common/AvatarPicker";
import { OptionSelector } from "@/components/common/OptionSelector";
import { YesNoSelector } from "@/components/common/YesNoSelector";
import { DatePicker } from "@/components/common/DatePicker";
import { Picker } from "@/components/common/Picker";
import { useTheme } from "@/hooks/useTheme";
import { petStep1Schema, PetStep1FormData } from "@/utils/validators";
import { Typography, Spacing } from "@/constants/theme";
import { useAddPetStore } from "@/store/addPetStore";
import { useCatalogStore } from "@/store/catalogStore";
import { ScreenHeader } from "@/components/common/ScreenHeader";

export default function AddPetStep1Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const formData = useAddPetStore();
  const insets = useSafeAreaInsets();

  const {
    dogBreeds,
    catBreeds,
    isLoading: loadingBreeds,
    fetchBreeds,
  } = useCatalogStore();

  const [photoUri, setPhotoUri] = useState<string | undefined>(
    formData.photo_url,
  );
  const [photoMimeType, setPhotoMimeType] = useState<string>("image/jpeg");
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    formData.birth_date ? new Date(formData.birth_date) : null,
  );
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

  useEffect(() => {
    if (species && (species === "dog" || species === "cat")) {
      fetchBreeds(species);
    }
  }, [species]);

  useEffect(() => {
    if (species) {
      setValue("breed", "");
    }
  }, [species]);

  const onContinue = (data: PetStep1FormData) => {
    formData.setStep1Data({
      ...data,
      photo_url: photoUri,
      photo_mime_type: photoMimeType,
    });
    router.push("/(screens)/add-pet-step2");
  };

  const handleCancel = () => {
    formData.clearForm();
    router.replace("/(tabs)/(user)");
  };

  const availableBreeds =
    species === "dog" ? dogBreeds : species === "cat" ? catBreeds : [];

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
      fontSize: Typography.fontSize.xl,
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
    loadingContainer: {
      padding: Spacing.md,
      alignItems: "center",
    },
    loadingText: {
      marginTop: Spacing.sm,
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
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
        <View style={styles.avatarContainer}>
          <AvatarPicker
            imageUri={photoUri || null}
            onImageSelected={(uri, mimeType) => {
              setPhotoUri(uri);
              setPhotoMimeType(mimeType);
              setValue("photo_url", uri);
            }}
          />
        </View>

        <Text style={styles.sectionTitle}>Conozcamos a tu mascota</Text>

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
            />
          )}
        />

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

        {species && (
          <>
            {loadingBreeds ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando razas...</Text>
              </View>
            ) : (
              <Controller
                control={control}
                name="breed"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    label="Raza"
                    value={value}
                    options={availableBreeds.map((b) => ({
                      id: b.id,
                      name: b.name,
                    }))}
                    placeholder="Selecciona una raza"
                    onSelect={onChange}
                    error={errors.breed?.message}
                  />
                )}
              />
            )}
          </>
        )}

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
        backHref="/(tabs)/(user)/pets"
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
