import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/common/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks";
import type { ClinicalHistory } from "@/types/clinical-history.type";
import { Icon } from "@/components/common";

export default function HistoryDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const [record, setRecord] = useState<ClinicalHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data) {
      try {
        const parsedRecord = JSON.parse(data);
        setRecord(parsedRecord);
        setLoading(false);
      } catch (e) {
        console.error("Error al parsear el objeto", e);
      }
    }
  }, [data]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={styles.itemText}>No se encontró el registro.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header con navegación hacia atrás */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/(user)/pet-detail")}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Detalle de Registro</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <Text style={styles.cardMainTitle}>
            {record.type} {record.doctor ? `• ${record.doctor}` : ""}
          </Text>
          <Text style={styles.dateText}>
            Fecha - {record.created_at ? formatDate(record.created_at) : "N/A"}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles</Text>
            <View style={styles.bulletRow}>
              <Text style={styles.itemText}>
                • <Text style={styles.boldText}>Resumen:</Text> {record.summary}
              </Text>
            </View>

            {/* Renderizado condicional de Stats */}
            {record.stats && (
              <>
                <View style={styles.bulletRow}>
                  <Text style={styles.itemText}>
                    • <Text style={styles.boldText}>Peso:</Text>{" "}
                    {record.stats.weight}
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.itemText}>
                    • <Text style={styles.boldText}>Piel:</Text>{" "}
                    {record.stats.skinStatus}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Renderizado condicional de Galería */}
          {record.visualRegistry && record.visualRegistry.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Registro visual</Text>
              <View style={styles.imageGrid}>
                {record.visualRegistry.map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones adicionales</Text>
            <Text style={styles.itemText}>
              {record.observations ||
                "Sin observaciones adicionales para este registro."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
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
    elevation: 2,
    shadowColor: "#000",
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
    marginBottom: 10,
  },
  bulletRow: { marginBottom: 6 },
  itemText: { fontSize: 14, color: "#333", lineHeight: 20 },
  boldText: { fontWeight: "bold" },

  // Estilos para la Grilla de Imágenes
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
    marginTop: 10,
  },
  thumbnail: {
    height: 100,
    width: "31%", // Para que quepan 3 por fila con espacio
    aspectRatio: 1,
    borderRadius: 15,
    marginBottom: 10,
    backgroundColor: "#F0F0F0",
  },
});
