import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Input } from "@/components/common/Input";
import { Picker } from "@/components/common/Picker";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

export default function SupportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const subjects = [
    { id: "servicio", name: "Reserva o servicio" },
    { id: "pago", name: "Pago o facturación" },
    { id: "cuenta", name: "Problema durante el servicio" },
    { id: "otro", name: "Otro motivo" },
  ];

  const handleWhatsApp = () => {
    const phoneNumber = "51999999999"; // Cambiar por el número real
    const url = `https://wa.me/${phoneNumber}`;
    Linking.openURL(url);
  };

  const handleSubmit = () => {
    console.log("Submit:", { subject, message });
    // TODO: Enviar formulario
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
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginBottom: Spacing.lg,
    },
    textArea: {
      height: 120,
      width: "100%",
      textAlignVertical: "top",
    },
    whatsappButton: {
      position: "absolute",
      bottom: 100,
      right: Spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#25D366",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    submitButton: {
      marginTop: Spacing.xl,
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
        <Text style={styles.headerTitle}>Ayuda y soporte</Text>
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
          <Text style={styles.sectionTitle}>Contactar a PAKU</Text>
          <Text style={styles.sectionSubtitle}>
            ¿Tienes dudas sobre tu servicio o tu cuenta? Nuestro equipo está
            listo para ayudarte.
          </Text>

          {/* Asunto */}
          <Picker
            label="Asunto"
            value={subject}
            options={subjects}
            placeholder="Selecciona un motivo"
            onSelect={setSubject}
          />

          {/* Mensaje */}
          <Input
            label="Mensaje"
            placeholder="Cuéntanos qué pasó."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            style={styles.textArea}
          />

          {/* Submit Button */}
          <Button
            title="Enviar"
            onPress={handleSubmit}
            fullWidth
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* WhatsApp Button */}
      <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
        <Icon name="whatsapp" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
