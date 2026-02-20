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

interface ComplaintFormData {
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  complaintType: string;
  email: string;
  address: string;
  service: string;
  serviceDate: string;
  complaint: string;
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
  } = useForm<ComplaintFormData>({
    defaultValues: {
      name: "",
      documentType: "",
      documentNumber: "",
      phone: "",
      complaintType: "",
      email: "",
      address: "",
      service: "",
      serviceDate: "",
      complaint: "",
    },
  });

  const documentTypes = [
    { id: "dni", name: "DNI" },
    { id: "ce", name: "Carnet de Extranjería" },
    { id: "passport", name: "Pasaporte" },
  ];

  const complaintTypes = [
    { id: "reclamo", name: "Reclamo" },
    { id: "queja", name: "Queja" },
  ];

  const services = [
    { id: "grooming", name: "Grooming - PAKU Spa Clásico" },
    { id: "veterinaria", name: "Veterinaria" },
    { id: "paseo", name: "Paseo" },
    { id: "otro", name: "Otro" },
  ];

  const onSubmit = async (data: ComplaintFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Complaint data:", data);

      // TODO: Enviar formulario a la API

      Alert.alert(
        "Reclamo enviado",
        "Tu reclamo ha sido registrado correctamente. Nos pondremos en contacto contigo pronto.",
        [
          {
            text: "OK",
            onPress: () => {
              reset();
              router.back();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el reclamo. Intenta nuevamente.");
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
      justifyContent: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      position: "relative",
      backgroundColor: colors.primary,
    },
    backButton: {
      position: "absolute",
      left: Spacing.md,
      width: 40,
    },
    headerTitle: {
      color: "#FFFFFF",
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      textAlign: "center",
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
          onPress={() => router.push("/(tabs)/(user)/profile")}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Libro de reclamaciones</Text>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.introTitle}>
            ¿Tuviste un inconveniente con el servicio?
          </Text>
          <Text style={styles.introText}>
            Si deseas registrar un reclamo formal, accede al Libro de
            Reclamaciones.
          </Text>

          {/* Nombre */}
          <Controller
            control={control}
            name="name"
            rules={{ required: "El nombre es requerido" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nombre"
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

          {/* Tipo de documento y Número */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="documentType"
                rules={{ required: "Requerido" }}
                render={({ field: { onChange, value } }) => (
                  <Picker
                    label="Tipo de documento"
                    value={value}
                    options={documentTypes}
                    placeholder="Selecciona"
                    onSelect={onChange}
                    error={errors.documentType?.message}
                    labelColor={colors.primary}
                  />
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="documentNumber"
                rules={{ required: "Requerido" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="N° de documento"
                    placeholder="Ej. 12345678"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.documentNumber?.message}
                    keyboardType="numeric"
                    returnKeyType="next"
                    colorLabel={colors.primary}
                  />
                )}
              />
            </View>
          </View>

          {/* Teléfono y Tipo */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="phone"
                rules={{ required: "Requerido" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Teléfono"
                    placeholder="Ej. 999 999 999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.phone?.message}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    colorLabel={colors.primary}
                  />
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="complaintType"
                rules={{ required: "Requerido" }}
                render={({ field: { onChange, value } }) => (
                  <Picker
                    label="Tipo"
                    value={value}
                    options={complaintTypes}
                    placeholder="Selecciona"
                    onSelect={onChange}
                    error={errors.complaintType?.message}
                    labelColor={colors.primary}
                  />
                )}
              />
            </View>
          </View>

          {/* Correo */}
          <Controller
            control={control}
            name="email"
            rules={{
              required: "El correo es requerido",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Correo inválido",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Correo"
                placeholder="correo@gmail.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                colorLabel={colors.primary}
              />
            )}
          />

          {/* Dirección */}
          <Controller
            control={control}
            name="address"
            rules={{ required: "La dirección es requerida" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Dirección"
                placeholder="Agregar dirección"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.address?.message}
                returnKeyType="next"
                colorLabel={colors.primary}
              />
            )}
          />

          {/* Servicio relacionado y Fecha */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="service"
                rules={{ required: "Requerido" }}
                render={({ field: { onChange, value } }) => (
                  <Picker
                    label="Servicio relacionado"
                    value={value}
                    options={services}
                    placeholder="Selecciona"
                    onSelect={onChange}
                    error={errors.service?.message}
                  />
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="serviceDate"
                rules={{ required: "Requerido" }}
                render={({ field: { onChange } }) => (
                  <DatePicker
                    label="Fecha del servicio"
                    value={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      onChange(date.toISOString().split("T")[0]);
                    }}
                    error={errors.serviceDate?.message}
                    paddingVertical={7}
                    fontWeight={"medium"}
                  />
                )}
              />
            </View>
          </View>

          {/* Detalle del reclamo */}
          <Controller
            control={control}
            name="complaint"
            rules={{ required: "El detalle es requerido" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Detalle del reclamo/queja"
                placeholder="Describe lo sucedido..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.complaint?.message}
                multiline
                numberOfLines={6}
                style={styles.textArea}
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
