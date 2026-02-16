import { Button, Icon, Text } from "@/components/common";
import { ServiceSelect } from "@/components/services/ServiceSelect";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks";
import { useSpaServices } from "@/hooks/useSpaceServices";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdditionalServiceScreen() {
  const { colors } = useTheme();
  const { serviceCode } = useLocalSearchParams();
  const { data: packages } = useSpaServices();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    backButton: {
      padding: Spacing.sm,
      width: 40,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
    },
    content: {
      flex: 1,
    },
    sectionMargin: {
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.md,
    },
    includesContainer: {
      marginBottom: Spacing.md,
    },
    includesTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      marginBottom: Spacing.xs,
    },
    includesItem: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      marginBottom: 2,
      lineHeight: 18,
    },
    fixedButton: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.lg,
      backgroundColor: colors.loginButton,
      borderTopColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 10,
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between", // Empuja los elementos a los extremos
      alignItems: "center",
    },
  });

  const [selectedExtra, setSelectedExtra] = useState<
    (typeof ADDITIONAL_OPTIONS)[0] | null
  >(null);

  const ADDITIONAL_OPTIONS = [
    {
      id: "1",
      label: "Deslanado + desmotado",
      price: 25,
      description: "Elimina pelo muerto y nudos.",
    },
    {
      id: "2",
      label: "Deslanado",
      price: 20,
      description: "Reduce caída y mejora la piel.",
    },
    {
      id: "3",
      label: "Desmontado",
      price: 15,
      description: "Retira nudos localizados.",
    },
    {
      id: "4",
      label: "Corte estético",
      price: 15,
      description: "Define y empareja el pelaje.",
    },
    {
      id: "5",
      label: "Mascarilla reconstructora",
      price: 25,
      description: "Hidrata y fortalece el pelo.",
    },
    {
      id: "6",
      label: "Atrevia One",
      price: 59,
      description: "Control antipulga mensual.",
      longDescription:
        "Tableta masticable de acción mensual (aprox. 30 días), indicada para el control de parásitos externos (ectoparásitos).",
      image: require("@assets/images/services/atrevia-one.png"),
    },
  ];

  const selectedService = packages?.find((pkg) => pkg.code === serviceCode);

  if (!selectedService) return <Text>Servicio no encontrado</Text>;

  const totalAmount = selectedService.price + (selectedExtra?.price || 0);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servicios adicionales</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionMargin}>
          {/* El componente ServiceSelect ya debe tener la lógica interna para mostrar
              la imagen y descripción larga si 'image' existe en la opción */}
          <ServiceSelect
            options={ADDITIONAL_OPTIONS}
            selectedId={selectedExtra?.id}
            onSelect={(option) => setSelectedExtra(option)}
          />
        </View>

        <View style={styles.fixedButton}>
          <View style={styles.priceRow}>
            <Text style={[styles.includesTitle, { color: colors.primary }]}>
              Subtotal
            </Text>
            <Text style={[styles.includesTitle, { color: colors.primary }]}>
              S/ {totalAmount}.00
            </Text>
          </View>

          <Button
            // Título dinámico: si eligió algo, ya no es "Omitir"
            title={selectedExtra ? "Continuar" : "Omitir y Continuar"}
            textStyle={{ fontSize: Typography.fontSize.sm }}
            style={{ borderRadius: BorderRadius.xl }}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/(user)/select-address",
                params: { serviceCode, extraId: selectedExtra?.id },
              });
            }}
            fullWidth
            // Eliminamos disabled={!location} si no se usa ubicación en esta vista
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
