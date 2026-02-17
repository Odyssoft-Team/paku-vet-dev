import { Button, Icon, Text } from "@/components/common";
import { BannerBase } from "@/components/home/BannerBase";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks";
import { useSpaServices } from "@/hooks/useSpaceServices";
import { useAddressStore } from "@/store/addressStore";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ServiceSelectedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { serviceCode } = useLocalSearchParams();
  const { data: packages } = useSpaServices();
  const { addresses, fetchAddresses } = useAddressStore();

  console.log("Datos del usuario:", JSON.stringify(addresses, null, 2));

  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Pantalla enfocada, pidiendo direcciones...");
      fetchAddresses();
    }, []),
  );

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
    serviceMainTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.xs,
    },
    sectionMargin: {
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.md,
    },
    packagePrice: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.sm,
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

  // 3. Encontramos el objeto específico
  const selectedService = packages?.find((pkg) => pkg.code === serviceCode);

  if (!selectedService) return <Text>Servicio no encontrado</Text>;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/(user)/service-details")}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de la reserva</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner principal */}
        <BannerBase
          imageSource={require("@assets/images/services/banner-service-1.png")}
          title="Grooming sin estrés"
          subtitle="Elige el PAKU Spa ideal para tu mascota."
        />

        {/* Service Info */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.serviceMainTitle, { color: colors.primary }]}>
            PAKU Spa - {selectedService.name}
          </Text>
          <Text>{selectedService.description}</Text>
          <Text style={[styles.packagePrice, { color: colors.primary }]}>
            Costo: {selectedService.price}
          </Text>
          <View style={styles.includesContainer}>
            <Text style={[styles.includesTitle, { color: colors.text }]}>
              Incluye:
            </Text>
            {selectedService.includes.map((item, index) => (
              <Text
                key={index}
                style={[styles.includesItem, { color: colors.text }]}
              >
                • {item}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.fixedButton}>
          <View style={styles.priceRow}>
            <Text style={[styles.includesTitle, { color: colors.primary }]}>
              Subtotal
            </Text>
            <Text style={[styles.includesTitle, { color: colors.primary }]}>
              S/ {selectedService.price}.00
            </Text>
          </View>
          <Button
            title="Continuar reserva"
            textStyle={{ fontSize: Typography.fontSize.sm }}
            style={{ borderRadius: BorderRadius.xl }}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(user)/select-address",
                // pathname: "/(tabs)/(user)/select-address",
                // pathname: "/(tabs)/(user)/additional-service",
                params: { serviceCode: serviceCode },
              })
            }
            fullWidth
            disabled={!location}
            // loading={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
