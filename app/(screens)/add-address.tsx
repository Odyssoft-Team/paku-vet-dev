import React, { useEffect } from "react";
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
import { Picker } from "@/components/common/Picker";
import { useTheme } from "@/hooks/useTheme";
import {
  addAddressStep1Schema,
  AddAddressStep1FormData,
} from "@/utils/validators";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useGeoStore } from "@/store/geoStore";
import { useAddAddressStore } from "@/store/addAddressStore";
import { Text } from "@/components/common";

export default function AddAddressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Stores
  const { districts, fetchDistricts } = useGeoStore();
  const formData = useAddAddressStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AddAddressStep1FormData>({
    resolver: zodResolver(addAddressStep1Schema),
    defaultValues: {
      district_id: formData.district_id || "",
      address_line: formData.address_line || "",
      building_number: formData.building_number || "",
      apartment_number: formData.apartment_number || "",
    },
  });

  // Cargar distritos al montar el componente
  useEffect(() => {
    if (districts.length === 0) {
      fetchDistricts();
    }
  }, []);

  // Restaurar datos del store si existen
  useEffect(() => {
    if (formData.district_id) {
      setValue("district_id", formData.district_id);
      setValue("address_line", formData.address_line);
      setValue("building_number", formData.building_number);
      setValue("apartment_number", formData.apartment_number);
    }
  }, []);

  const onContinue = (data: AddAddressStep1FormData) => {
    // Guardar datos en el store
    formData.setStep1Data({
      district_id: data.district_id,
      address_line: data.address_line,
      building_number: data.building_number || "",
      apartment_number: data.apartment_number || "",
    });

    // Encontrar el distrito seleccionado
    const selectedDistrict = districts.find((d) => d.id === data.district_id);

    // Construir query de búsqueda
    const fullAddress = `${data.address_line} ${data.building_number}${
      data.apartment_number ? `, ${data.apartment_number}` : ""
    }, ${selectedDistrict?.name || ""}, Lima, Perú`;

    // Navegar al mapa
    router.push({
      pathname: "/(screens)/confirm-address-location",
      params: {
        search_query: fullAddress,
      },
    });
  };

  const handleGoBack = () => {
    // Limpiar el formulario al cancelar
    formData.clearForm();
    router.push("/(tabs)/(user)");
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
      paddingBottom: 100,
    },
    fixedField: {
      marginBottom: Spacing.md,
    },
    fixedLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    fixedValue: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.border + "40",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    fixedValueText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
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
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar dirección</Text>
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
          {/* Departamento - Fijo */}
          <View style={styles.fixedField}>
            <Text style={styles.fixedLabel}>Departamento</Text>
            <View style={styles.fixedValue}>
              <Text style={styles.fixedValueText}>Lima</Text>
            </View>
          </View>

          {/* Provincia - Fijo */}
          <View style={styles.fixedField}>
            <Text style={styles.fixedLabel}>Provincia</Text>
            <View style={styles.fixedValue}>
              <Text style={styles.fixedValueText}>Lima</Text>
            </View>
          </View>

          {/* Distrito - Desplegable */}
          <Controller
            control={control}
            name="district_id"
            render={({ field: { onChange, value } }) => (
              <Picker
                label="Distrito"
                value={value}
                options={districts.map((d) => ({ id: d.id, name: d.name }))}
                placeholder="Selecciona un distrito"
                onSelect={onChange}
                error={errors.district_id?.message}
              />
            )}
          />

          {/* Avenida/Calle/Jirón */}
          <Controller
            control={control}
            name="address_line"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Avenida/Calle/Jirón"
                placeholder="Ingresa el nombre de la calle"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.address_line?.message}
                returnKeyType="next"
              />
            )}
          />

          {/* Número */}
          <Controller
            control={control}
            name="building_number"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Número (opcional)"
                placeholder="Ingresa el número de la calle"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.building_number?.message}
                keyboardType="numeric"
                returnKeyType="next"
              />
            )}
          />

          {/* Dpto/Interior/Piso/Lote (Opcional) */}
          <Controller
            control={control}
            name="apartment_number"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Dpto./Interior/Piso/Lote/Bloque (opcional)"
                placeholder="Ej. Casa 10, dpto 101"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                returnKeyType="done"
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
