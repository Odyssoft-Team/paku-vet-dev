import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { AvatarPicker } from "@/components/common/AvatarPicker";
import { GenderSelector } from "@/components/common/GenderSelector";
import { DatePicker } from "@/components/common/DatePicker";
import { SuccessModal } from "@/components/common/SuccessModal";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { registerSchema, RegisterFormData } from "@/utils/validators";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { UserSex } from "@/types/auth.types";
import { useLocationStore } from "@/store/locationStore";
import { Picker } from "@/components/common";
import { useGeoStore } from "@/store/geoStore";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, error, clearError } = useAuth();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { districts, fetchDistricts } = useGeoStore();
  const [districtSelected, setDistrictSelected] = useState<string>("");
  // Cargar distritos al montar el componente
  useEffect(() => {
    if (districts.length === 0) {
      fetchDistricts();
    }
  }, []);

  const insets = useSafeAreaInsets();

  // Obtener datos de ubicación del store
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

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
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
    // Revisar cada vez que la pantalla está activa
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

      // Preparar datos para el registro
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
        profile_photo_url: profileImage || undefined,
      };

      await register(registerData);

      clearLocation();
      setShowSuccessModal(true);
    } catch (err) {
      console.log("Register error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Validar campos básicos antes de ir al mapa
    handleSubmit(onSubmit)();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      // marginTop: insets.top,
      marginBottom: insets.bottom,
      marginLeft: insets.left,
      marginRight: insets.right,
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
      fontWeight: Typography.fontWeight.bold,
      color: "#FFFFFF",
      textAlign: "center",
      marginRight: 40, // Compensar el botón de atrás
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: 100, // Espacio para el botón fijo
    },
    welcomeText: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      color: colors.primary,
      marginBottom: Spacing.xs,
      fontWeight: Typography.fontWeight.semibold,
    },
    inputsContainer: {
      gap: Spacing.sm,
    },
    row: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    halfInput: {
      flex: 1,
    },
    addressButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      marginBottom: Spacing.md,
    },
    addressText: {
      fontSize: Typography.fontSize.md,
      color: colors.placeholder,
    },
    addressTextFilled: {
      color: colors.text,
      maxWidth: "90%",
    },
    errorText: {
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
        <Text style={styles.headerTitle}>Crear cuenta</Text>
      </View>

      {/* Formulario */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <AvatarPicker
            imageUri={profileImage}
            onImageSelected={setProfileImage}
          />

          <Text style={styles.welcomeText}>Bienvenido/a a Paku</Text>
          {/* Nombre */}
          <Text style={styles.sectionTitle}>Nombre</Text>
          <View style={styles.row}>
            <Controller
              control={control}
              name="first_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.halfInput}>
                  <Input
                    placeholder="Nombres"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.first_name?.message}
                    returnKeyType="next"
                  />
                </View>
              )}
            />
          </View>

          {/* Apellido */}
          <Text style={styles.sectionTitle}>Apellido</Text>
          <View style={styles.row}>
            <Controller
              control={control}
              name="last_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.halfInput}>
                  <Input
                    placeholder="Apellidos"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.last_name?.message}
                    returnKeyType="next"
                  />
                </View>
              )}
            />
          </View>

          {/* Telefono */}
          <Text style={styles.sectionTitle}>Teléfono</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
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

          {/* Correo */}
          <Text style={styles.sectionTitle}>Correo</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
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

          <Picker
            label="Distrito"
            value={districtSelected}
            options={districts.map((d) => ({ id: d.id, name: d.name }))}
            placeholder="Selecciona un distrito"
            onSelect={setDistrictSelected}
          />

          <View style={styles.row}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.halfInput}>
                  <Text style={styles.sectionTitle}>Contraseña</Text>
                  <Input
                    type="password"
                    placeholder="contraseña"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    returnKeyType="next"
                    variant="register"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.halfInput}>
                  <Text style={styles.sectionTitle}>Confirmar contraseña</Text>
                  <Input
                    type="password"
                    placeholder="contraseña"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    returnKeyType="done"
                    variant="register"
                  />
                </View>
              )}
            />
          </View>

          {/* Género */}
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

          {/* Fecha de Nacimiento */}
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

          {/* Dirección */}
          {/* <Text style={styles.sectionTitle}>Dirección</Text>
          <TouchableOpacity
            style={styles.addressButton}
            onPress={() => {
              // Navegar a la pantalla del mapa
              router.push("/(auth)/select-location");
            }}
          >
            <Text
              style={[
                styles.addressText,
                watch("address_line") && styles.addressTextFilled,
              ]}
            >
              {watch("address_line") || "Agregar dirección"}
            </Text>
            <Icon name="gps" size={20} color={colors.primary + "80"} />
          </TouchableOpacity> */}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Botón fijo */}
      <View style={styles.fixedButton}>
        <Button
          title="Continuar"
          onPress={handleContinue}
          loading={isLoading}
          fullWidth
        />
      </View>

      {/* Modal de éxito */}
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
