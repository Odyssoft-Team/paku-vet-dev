import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/common/Text";
import { SALUD_LIST } from "@/constants/appointment";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks";
import { Icon } from "@/components/common";

export default function HealthDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F5F5" }, // Fondo grisáceo ligero
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      position: "relative",
    },
    backButton: {
      position: "absolute",
      left: Spacing.md,
      width: 40,
    },
    navTitle: {
      color: "#FFFFFF",
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      textAlign: "center",
    },
    scrollContent: { padding: Spacing.lg },
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 15,
      padding: 20,
      elevation: 2, // Sombra Android
      shadowColor: "#000", // Sombra iOS
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    cardMainTitle: {
      color: "#2D3FE6",
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 4,
    },
    dateText: { fontSize: 14, color: "#333", marginBottom: 15 },
    section: { marginTop: 15 },
    sectionTitle: {
      color: "#2D3FE6",
      fontSize: 15,
      fontWeight: "bold",
      marginBottom: 8,
    },
    bulletRow: { marginBottom: 4 },
    itemText: { fontSize: 14, color: "#333" },
    boldText: { fontWeight: "bold" },
    attachmentBox: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#F0F0F0",
      padding: 12,
      borderRadius: 5,
      marginBottom: 8,
    },
    attachmentName: { fontSize: 14, color: "#333" },
    closeIcon: { fontSize: 18, color: "#666" },
    observationsText: { fontSize: 14, color: "#333", lineHeight: 20 },
  });

  const appointment = SALUD_LIST.find((item) => item.id === id);

  if (!appointment) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No se encontró la información.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header - Color Primario */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(user)/(menu)/pet-detail")}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Registro</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Card Principal */}
        <View style={styles.card}>
          <Text style={styles.cardMainTitle}>
            {appointment.type} • {appointment.doctor}
          </Text>
          <Text style={styles.dateText}>Fecha - {appointment.date}</Text>

          {/* Detalles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del registro</Text>
            <View style={styles.bulletRow}>
              <Text style={styles.itemText}>
                • <Text style={styles.boldText}>Motivo:</Text>{" "}
                {appointment.details.reason}
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.itemText}>
                • <Text style={styles.boldText}>Diagnóstico:</Text>{" "}
                {appointment.details.diagnosis}
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.itemText}>
                • <Text style={styles.boldText}>Tratamiento:</Text>{" "}
                {appointment.details.treatment}
              </Text>
            </View>
          </View>

          {/* Adjuntos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documentos adjuntos</Text>
            {appointment.attachments?.map((file, index) => (
              <TouchableOpacity key={index} style={styles.attachmentBox}>
                <Text style={styles.attachmentName}>{file.name}</Text>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Observaciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones:</Text>
            <Text style={styles.observationsText}>
              {appointment.observations}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
