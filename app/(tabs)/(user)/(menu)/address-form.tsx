import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Input } from "@/components/common/Input";
import { Picker } from "@/components/common/Picker";
import { Button } from "@/components/common/Button";
import { DatePicker } from "@/components/common/DatePicker";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

interface AddressFormData {
  department: string;
  province: string;
  district: string;
  street: string;
  number: string;
  additionalInfo: string;
}

export default function ComplaintsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressFormData>({
    defaultValues: {
      department: "",
      province: "",
      district: "",
      street: "",
      number: "",
      additionalInfo: "",
    },
  });

  const departments = [
    { id: "15", name: "Lima" }, // Usando el código de departamento estándar
  ];

  const provinces = [
    { id: "1501", name: "Lima" }, // Provincia de Lima
  ];

  const districts = [
    { id: "150101", name: "Lima" },
    { id: "150104", name: "Barranco" },
    { id: "150105", name: "Breña" },
    { id: "150113", name: "Jesús María" },
    { id: "150114", name: "La Molina" },
    { id: "150115", name: "La Victoria" },
    { id: "150116", name: "Lince" },
    { id: "150120", name: "Magdalena del Mar" },
    { id: "150121", name: "Pueblo Libre" },
    { id: "150122", name: "Miraflores" },
    { id: "150130", name: "San Borja" },
    { id: "150131", name: "San Isidro" },
    { id: "150136", name: "San Miguel" },
    { id: "150140", name: "Santiago de Surco" },
    { id: "150141", name: "Surquillo" },
  ];

  const onSubmit = async (data: AddressFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Complaint data:", data);

      // TODO: Enviar formulario a la API

      Alert.alert(
        "Dirección registrada",
        "Tu dirección ha sido registrada correctamente.",
        [
          {
            text: "OK",
            onPress: () => {
              reset();
              router.push("/(tabs)/(user)/additional-service");
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo enviar la dirección. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
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
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
      marginRight: 40,
    },
    content: {
      padding: Spacing.lg,
      paddingBottom: 100,
    },
    introTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    introText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
      lineHeight: 20,
    },
    row: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    halfWidth: {
      flex: 1,
    },
    textArea: {
      height: 120,
      textAlignVertical: "top",
    },
    submitButton: {
      marginTop: Spacing.lg,
      marginBottom: 60,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/(user)/service-details")}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar dirección</Text>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Departamentos */}
          <Controller
            control={control}
            name="department"
            rules={{ required: "El departamento es requerido" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Picker
                label="Departamento"
                value={value}
                options={departments}
                placeholder="Selecciona un departamento"
                onSelect={onChange}
                error={errors.department?.message}
                labelColor={colors.primary}
              />
            )}
          />

          {/* Provincias */}
          <Controller
            control={control}
            name="province"
            rules={{ required: "La provincia es requerida" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Picker
                label="Provincia"
                value={value}
                options={provinces}
                placeholder="Selecciona una provincia"
                onSelect={onChange}
                error={errors.province?.message}
                labelColor={colors.primary}
              />
            )}
          />

          {/* Distrito */}
          <Controller
            control={control}
            name="district"
            rules={{ required: "El distrito es requerido" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Picker
                label="Distrito"
                value={value}
                options={districts}
                placeholder="Selecciona un distrito"
                onSelect={onChange}
                error={errors.district?.message}
                labelColor={colors.primary}
              />
            )}
          />

          {/* Calle */}
          <Controller
            control={control}
            name="street"
            rules={{ required: "El nombre de la calle es requerido" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Avenida/Calle/Jirón"
                placeholder="Ingresa el nombre de la calle"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.street?.message}
                autoCapitalize="words"
                returnKeyType="next"
                colorLabel={colors.primary}
              />
            )}
          />

          {/* Numero */}
          <Controller
            control={control}
            name="number"
            rules={{ required: "El número es requerido" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Número"
                placeholder="Ingresa el número de la calle"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.number?.message}
                keyboardType="numeric"
                returnKeyType="next"
                colorLabel={colors.primary}
              />
            )}
          />

          {/* Referencia */}
          <Controller
            control={control}
            name="additionalInfo"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Dpto./Interior/Piso/Lote/Bloque (opcional)"
                placeholder="Ej. Casa 3, dpto 101"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.additionalInfo?.message}
                autoCapitalize="sentences"
                returnKeyType="done"
                colorLabel={colors.primary}
              />
            )}
          />

          {/* Submit Button */}
          <Button
            title="Enviar"
            onPress={handleSubmit(onSubmit)}
            fullWidth
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
