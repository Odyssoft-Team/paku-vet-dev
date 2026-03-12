import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Text } from "@/components/common/Text";
import { AvatarPicker } from "@/components/common/AvatarPicker";
import { GenderSelector } from "@/components/common/GenderSelector";
import { DatePicker } from "@/components/common/DatePicker";
import { SuccessModal } from "@/components/common/SuccessModal";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { useUploadPhoto } from "@/hooks/useUploadPhoto";
import { useTheme } from "@/hooks/useTheme";
import { registerSchema, RegisterFormData } from "@/utils/validators";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { UserSex } from "@/types/auth.types";
import { useLocationStore } from "@/store/locationStore";
import { ScreenHeader } from "@/components/common/ScreenHeader";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, error, clearError } = useAuth();
  const user = useAuthStore((state) => state.user);
  const { uploadPhoto, isUploading } = useUploadPhoto();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileMimeType, setProfileMimeType] = useState<string>("image/jpeg");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const insets = useSafeAreaInsets();

  const locationData = useLocationStore((state) => ({
    latitude: state.latitude,
    longitude: state.longitude,
    address: state.address,
  }));
  const clearLocation = useLocationStore((state) => state.clearLocation);

  const [locationCoords, setLocationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      sex: undefined,
      birth_date: "",
      dni: "",
      address_line: "",
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        locationData.address &&
        locationData.latitude &&
        locationData.longitude
      ) {
        setValue("address_line", locationData.address);
        setLocationCoords({
          lat: locationData.latitude,
          lng: locationData.longitude,
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [locationData]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      clearError();

      // Paso 1 — Registrar sin foto (el backend no acepta profile_photo_url en register)
      const registerData = {
        email: data.email,
        password: data.password,
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
        sex: data.sex as UserSex,
        birth_date: data.birth_date,
        role: "user" as const,
        dni: data.dni || undefined,
        address:
          locationCoords && data.address_line
            ? {
                district_id: "default",
                address_line: data.address_line,
                lat: locationCoords.lat,
                lng: locationCoords.lng,
              }
            : undefined,
      };

      await register(registerData);
      // Después de register() el store ya tiene user + token listos

      // Paso 2 — Subir foto si el usuario seleccionó una
      if (profileImage) {
        const registeredUser = useAuthStore.getState().user;
        console.log(
          "[Register] user en store:",
          registeredUser?.id,
          "| profile_photo_url:",
          registeredUser?.profile_photo_url,
        );
        console.log(
          "[Register] Iniciando upload — uri:",
          profileImage,
          "| mimeType:",
          profileMimeType,
        );
        if (registeredUser?.id) {
          const result = await uploadPhoto(
            "user",
            registeredUser.id,
            profileImage,
            profileMimeType,
          );
          console.log(
            "[Register] Upload exitoso — objectName:",
            result.objectName,
            "| readUrl:",
            result.readUrl,
          );
        }
      } else {
        console.log("[Register] Sin imagen seleccionada, saltando upload");
      }

      clearLocation();
      setShowSuccessModal(true);
    } catch (err) {
      console.log("Register error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    backButton: {
      padding: Spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
      marginRight: 40,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    welcomeText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: Spacing.md,
    },
    errorText: {
      fontFamily: Typography.fontFamily.regular,
      color: colors.error,
      fontSize: Typography.fontSize.sm,
      textAlign: "center",
      marginTop: Spacing.md,
      backgroundColor: colors.error + "20",
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
    },
    fixedButton: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
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
        <AvatarPicker
          imageUri={profileImage}
          onImageSelected={(uri, mimeType) => {
            setProfileImage(uri);
            setProfileMimeType(mimeType);
          }}
        />

        <Text style={styles.welcomeText}>Bienvenido/a a Paku</Text>

        <Controller
          control={control}
          name="first_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nombre"
              placeholder="Nombres"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.first_name?.message}
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="last_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Apellido"
              placeholder="Apellidos"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.last_name?.message}
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Teléfono"
              type="phone"
              placeholder="Ej. 999 999 999"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Correo"
              type="email"
              placeholder="correo@gmail.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Contraseña"
              type="password"
              placeholder="Contraseña"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              returnKeyType="next"
              variant="register"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Contraseña"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              returnKeyType="done"
              variant="register"
            />
          )}
        />

        <Controller
          control={control}
          name="sex"
          render={({ field: { onChange, value } }) => (
            <GenderSelector
              value={value as UserSex}
              onChange={onChange}
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

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.fixedButton}>
        <Button
          title="Registrarme"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading || isUploading}
          fullWidth
        />
      </View>
    </>
  );

  return (
    // edges=["top","bottom"] para que SafeAreaView maneje ambos extremos limpiamente
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScreenHeader title="Crear cuenta" backHref="/(auth)/login" />

      {/* iOS: KAV nativo funciona perfecto con behavior="padding"
          Android: paddingBottom manual con el listener del teclado, sin KAV */}
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {formContent}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
          {formContent}
        </View>
      )}

      <SuccessModal
        visible={showSuccessModal}
        title="¡Listo, tu cuenta fue creada!"
        message="Ya puedes iniciar sesión con tus credenciales"
        buttonText="Ir al inicio"
        onButtonPress={() => {
          setShowSuccessModal(false);
          router.replace("/(auth)/login-form");
        }}
      />
    </SafeAreaView>
  );
}
