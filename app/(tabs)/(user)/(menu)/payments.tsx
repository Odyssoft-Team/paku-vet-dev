import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

interface AccordionItemProps {
  title: string;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  content,
  isOpen,
  onToggle,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    accordionContainer: {
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
      overflow: "hidden",
    },
    accordionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: Spacing.md,
    },
    accordionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      flex: 1,
      marginRight: Spacing.sm,
    },
    accordionContent: {
      padding: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
    },
    accordionText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      lineHeight: 20,
    },
  });

  return (
    <View
      style={[styles.accordionContainer, { backgroundColor: colors.surface }]}
    >
      <TouchableOpacity style={styles.accordionHeader} onPress={onToggle}>
        <Text style={[styles.accordionTitle, { color: colors.primary }]}>
          {title}
        </Text>
        <Icon
          name="arrow-down"
          size={20}
          color={colors.primary}
          style={{
            transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
          }}
        />
      </TouchableOpacity>

      {isOpen && (
        <View
          style={[styles.accordionContent, { borderTopColor: colors.border }]}
        >
          <Text style={[styles.accordionText, { color: colors.text }]}>
            {content}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function PaymentsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      title: "¿Cómo pago en Paku?",
      content:
        "En Paku puedes pagar de forma rápida y segura con Yape o tarjeta de débito/crédito directamente desde la app.",
    },
    {
      title: "¿Puedo guardar mi tarjeta?",
      content:
        "Sí, puedes guardar tu tarjeta para futuras reservas y pagar más rápido.",
    },
    {
      title: "¿Recibo comprobante?",
      content: "Sí, al finalizar tu pago recibirás un comprobante digital.",
    },
    {
      title: "¿Puedo cancelar y solicitar mi reembolso?",
      content: `PAKU no realiza cancelaciones ni reembolsos una vez confirmado y pagado el servicio.

Al reservar y pagar, el servicio queda bloqueado y programado, por lo que no puede ser cancelado ni reembolsado, incluso si:
Cambias de opinión.
No te encuentras en casa.
Surge un imprevisto personal.
Te arrepientes luego del pago.

Excepción legal
PAKU solo realizará reembolsos cuando la ley lo exija expresamente. Esto aplica únicamente en casos como:
Cobro duplicado por error del sistema.
El servicio no se realizó por responsabilidad de PAKU.
Fallas técnicas graves comprobadas.`,
    },
  ];

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
        <Text style={styles.headerTitle}>Pagos y facturación</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            title={faq.title}
            content={faq.content}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
