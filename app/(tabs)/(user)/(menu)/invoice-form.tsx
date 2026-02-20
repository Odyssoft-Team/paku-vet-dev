import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";
import { useBookingStore } from "@/store/bookingStore";

type InvoiceFormValues = {
  ruc: string;
  razonSocial: string;
  correo: string;
};

export default function InvoiceFormScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { invoiceData, setInvoice } = useBookingStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    defaultValues: {
      ruc: invoiceData?.ruc || "",
      razonSocial: invoiceData?.razonSocial || "",
      correo: invoiceData?.correo || "",
    },
  });

  const onSubmit = (data: InvoiceFormValues) => {
    setInvoice({
      ruc: data.ruc.trim(),
      razonSocial: data.razonSocial.trim(),
      correo: data.correo.trim(),
    });
    router.push("/(tabs)/(user)/cart");
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    backBtn: { padding: Spacing.sm, width: 40 },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFF",
      textAlign: "center",
    },
    content: { flex: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
    hint: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginTop: -Spacing.xs,
      marginBottom: Spacing.sm,
      marginLeft: 2,
    },
    fixedBottom: {
      padding: Spacing.lg,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border + "30",
    },
  });

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.push("/(tabs)/(user)/cart")}
        >
          <Icon name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tu carrito</Text>
        <View style={s.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* RUC */}
          <Controller
            control={control}
            name="ruc"
            rules={{
              required: "El RUC es requerido",
              pattern: {
                value: /^\d{11}$/,
                message: "El RUC debe tener 11 dígitos",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="RUC"
                placeholder="Validación automática"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="numeric"
                maxLength={11}
                error={errors.ruc?.message}
                containerStyle={{ marginBottom: Spacing.sm }}
              />
            )}
          />

          {/* Razón social */}
          <Controller
            control={control}
            name="razonSocial"
            rules={{ required: "La razón social es requerida" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Razón social"
                placeholder="Nombre de la empresa o persona natural con negocio"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.razonSocial?.message}
                containerStyle={{ marginBottom: Spacing.sm }}
              />
            )}
          />

          {/* Correo */}
          <Controller
            control={control}
            name="correo"
            rules={{
              required: "El correo es requerido",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Ingresa un correo válido",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Correo"
                placeholder="correo@gmail.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                type="email"
                error={errors.correo?.message}
                containerStyle={{ marginBottom: 2 }}
              />
            )}
          />
          {!errors.correo && (
            <Text style={s.hint}>
              Correo electrónico para envío de factura.
            </Text>
          )}
        </ScrollView>

        <View style={s.fixedBottom}>
          <Button
            title="Continuar"
            onPress={handleSubmit(onSubmit)}
            fullWidth
            style={{ borderRadius: 20 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
