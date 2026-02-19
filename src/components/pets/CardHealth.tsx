import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/common/Text";
import { Appointment } from "@/constants/appointment";
import { useRouter } from "expo-router";
import { Button } from "../common";

interface Props {
  appointment: Appointment;
}

export default function CardHealth({ appointment }: Props) {
  const router = useRouter();
  return (
    <View style={styles.card}>
      {/* Contenedor de Información */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{appointment.type}</Text>

        <Text style={styles.subtitle}>Fecha - {appointment.date}</Text>

        <View style={styles.doctorContainer}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.subtitle}>{appointment.doctor}</Text>
        </View>
      </View>

      {/* Botón Ver */}
      <Button
        title="Ver"
        textStyle={{ fontSize: 13 }}
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/(user)/healt-detail",
            params: { id: appointment.id },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Sombra para Android
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    color: "#2D3FE6", // El azul vibrante de tu captura
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#333333",
    fontSize: 14,
    lineHeight: 20,
  },
  doctorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  bullet: {
    fontSize: 18,
    marginRight: 4,
    color: "#333333",
  },
  button: {
    backgroundColor: "#2D3FE6",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginLeft: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
