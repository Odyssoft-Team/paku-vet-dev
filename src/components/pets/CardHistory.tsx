import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/common/Text";
import { useRouter } from "expo-router";
import type { ClinicalHistory } from "@/types/clinical-history.type";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks";
import { Button } from "../common";

interface Props {
  history: ClinicalHistory;
  petId: string;
}

export default function CardHistory({ history, petId }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginVertical: Spacing.sm,
      ...Shadows.lg,
      elevation: 3,
    },
    title: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: Typography.fontWeight.bold,
      marginBottom: 4,
    },
    date: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
    },
    statsContainer: {
      marginBottom: 20,
    },
    statItem: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
    },
    bold: {
      fontWeight: Typography.fontWeight.bold,
    },
    button: {
      color: colors.primary,
      borderRadius: BorderRadius.xl,
      paddingVertical: 14,
      alignItems: "center",
    },
    buttonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: Typography.fontWeight.bold,
    },
  });

  return (
    <View style={styles.card}>
      {/* Título y Proveedor */}

      <Text style={styles.title}>{history.type} •</Text>

      {/* Fecha del registro */}
      <Text style={styles.date}>
        Fecha - {history.created_at ? formatDate(history.created_at) : "N/A"}
      </Text>

      {/* Lista de detalles rápidos (Stats) */}
      <View style={styles.statsContainer}>
        {/* <Text style={styles.statItem}>
          • <Text style={styles.bold}>Peso registrado:</Text>{" "}
          {history.stats?.weight}
        </Text> */}
        {/* <Text style={styles.statItem}>
          • <Text style={styles.bold}>Estado de piel:</Text>{" "}
          {history.stats?.skinStatus}
        </Text>
        <Text style={styles.statItem}>
          • <Text style={styles.bold}>Estado de pelaje:</Text>{" "}
          {history.stats?.furStatus}
        </Text>
        <Text style={styles.statItem}>
          • <Text style={styles.bold}>Evidencias:</Text> 5 fotos + 1 video
        </Text> */}
        <Text style={styles.statItem}>
          {/* • <Text style={styles.bold}>Recomendación final:</Text>{" "} */}•{" "}
          <Text style={styles.bold}>Descripcion:</Text> {history.summary}
        </Text>
      </View>

      {/* Botón Ver Detalles */}
      <Button
        title="Ver detalles"
        style={styles.button}
        textStyle={{ fontSize: 13 }}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/(user)/history-detail",
            params: {
              id: history.id,
              // Convertimos el objeto a string
              data: JSON.stringify(history),
            },
          })
        }
      />
    </View>
  );
}
