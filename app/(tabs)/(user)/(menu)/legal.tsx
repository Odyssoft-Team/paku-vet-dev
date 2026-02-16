import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";

export default function LegalScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    backButton: {
      padding: Spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
      marginRight: 40,
    },
    content: {
      padding: Spacing.lg,
    },
    mainTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    welcome: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      // marginBottom: Spacing.lg,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    paragraph: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      // marginBottom: Spacing.md,
      lineHeight: 20,
    },
    bulletPoint: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      marginBottom: Spacing.xs,
      paddingLeft: Spacing.md,
      lineHeight: 20,
    },
    subBulletPoint: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      marginBottom: Spacing.xs,
      paddingLeft: Spacing.xl,
      lineHeight: 20,
    },
    highlight: {
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
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
        <Text style={styles.headerTitle}>Información legal</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle}>Términos y condiciones de uso</Text>
        <Text style={styles.welcome}>
          Bienvenido a PAKU.{"\n"}
          Al utilizar esta aplicación, aceptas los siguientes términos y
          condiciones que regulan el acceso y uso de nuestros servicios
          digitales de cuidado para mascotas.
        </Text>

        {/* Sección 1 */}
        <Text style={styles.sectionTitle}>1. Sobre PAKU</Text>
        <Text style={styles.paragraph}>
          PAKU es una plataforma digital que permite a los usuarios gestionar,
          reservar y dar seguimiento a servicios de cuidado para mascotas,
          comenzando con PAKU Spa y expandiéndose progresivamente a otros
          servicios.
        </Text>

        {/* Sección 2 */}
        <Text style={styles.sectionTitle}>2. Uso del servicio de PAKU</Text>
        <Text style={styles.bulletPoint}>
          • El usuario deberá registrar información veraz y actualizada sobre su
          perfil y el de su mascota.
        </Text>
        <Text style={styles.bulletPoint}>
          • Los servicios están sujetos a disponibilidad operativa y validación
          previa.
        </Text>
        <Text style={styles.bulletPoint}>
          • El tiempo del servicio puede variar según el tamaño, condición,
          estado de salud y comportamiento de la mascota.
        </Text>

        {/* Sección 3 */}
        <Text style={styles.sectionTitle}>3. Reservas y pagos</Text>
        <Text style={styles.bulletPoint}>
          • Todas las reservas se realizan exclusivamente a través de la
          aplicación.
        </Text>
        <Text style={styles.bulletPoint}>
          • El pago del servicio se efectúa antes de su prestación, mediante los
          medios disponibles en la plataforma.
        </Text>
        <Text style={styles.bulletPoint}>
          • PAKU no realiza cancelaciones ni reembolsos, salvo disposición legal
          obligatoria.
        </Text>

        {/* Sección 4 */}
        <Text style={styles.sectionTitle}>
          4. Reprogramación y cancelaciones
        </Text>

        <Text style={[styles.paragraph, styles.highlight, { marginBottom: 5 }]}>
          Reprogramación solicitada por el usuario:
        </Text>
        <Text style={styles.bulletPoint}>
          • El usuario podrá solicitar la reprogramación de un servicio con un
          mínimo de 24 horas de anticipación.
        </Text>
        <Text style={styles.bulletPoint}>
          • La reprogramación estará sujeta a la disponibilidad de cupos
          operativos.
        </Text>
        <Text style={styles.bulletPoint}>
          • Las solicitudes fuera de este plazo podrán considerarse como
          servicio perdido.
        </Text>

        <Text
          style={[
            styles.paragraph,
            styles.highlight,
            { marginTop: Spacing.md, marginBottom: 5 },
          ]}
        >
          Reprogramación solicitada por PAKU:
        </Text>
        <Text style={styles.bulletPoint}>
          • En casos excepcionales y por motivos operativos de fuerza mayor,
          tales como fallas técnicas del vehículo, equipos, imprevistos del
          personal u otros eventos no previstos, PAKU podrá proponer una
          reprogramación.
        </Text>
        <Text style={styles.bulletPoint}>
          • En estos casos, el usuario será notificado con la mayor anticipación
          posible y la reprogramación se realizará solo con su consentimiento,
          garantizando siempre una comunicación transparente y responsable.
        </Text>

        {/* Sección 5 */}
        <Text style={styles.sectionTitle}>
          5. Criterio profesional y validación del servicio
        </Text>
        <Text
          style={[
            styles.paragraph,
            styles.highlight,
            { marginTop: Spacing.md, marginBottom: 5 },
          ]}
        >
          Sobre cortes especializados:
        </Text>
        <Text style={styles.paragraph}>
          Algunos estilos de corte requieren técnicas específicas. La ejecución
          final del servicio estará sujeta a la evaluación profesional del
          groomer y al bienestar de la mascota.
        </Text>

        <Text
          style={[
            styles.paragraph,
            styles.highlight,
            { marginTop: Spacing.md, marginBottom: 5 },
          ]}
        >
          Validación del servicio:
        </Text>
        <Text style={styles.paragraph}>
          PAKU prioriza la seguridad y comodidad de cada mascota. Si el servicio
          o corte solicitado no es recomendable o no puede realizarse de forma
          segura, el equipo podrá proponer una alternativa adecuada o una
          reprogramación del servicio.
        </Text>

        <Text
          style={[
            styles.paragraph,
            styles.highlight,
            { marginTop: Spacing.md, marginBottom: 5 },
          ]}
        >
          Reprogramaciones por criterio profesional:
        </Text>
        <Text style={styles.paragraph}>
          En casos donde el servicio solicitado requiera un groomer
          especializado o condiciones específicas no disponibles en el momento,
          PAKU podrá reprogramar el servicio sin costo adicional, previa
          coordinación y comunicación con el usuario.
        </Text>

        {/* Sección 6 */}
        <Text style={styles.sectionTitle}>6. Responsabilidad del usuario</Text>
        <Text style={styles.bulletPoint}>
          • El usuario es responsable de informar de manera completa y oportuna
          sobre condiciones de salud, sensibilidad de piel, tratamientos activos
          o comportamientos especiales de la mascota.
        </Text>
        <Text style={styles.bulletPoint}>
          • PAKU no se responsabiliza por incidentes derivados de información
          incorrecta, incompleta u omitida proporcionada por el usuario.
        </Text>

        {/* Sección 7 */}
        <Text style={styles.sectionTitle}>
          7. Conducta de la mascota durante el servicio
        </Text>
        <Text style={styles.paragraph}>
          PAKU se reserva el derecho de suspender o finalizar el servicio si
          durante su ejecución la mascota presenta un comportamiento agresivo o
          que represente un riesgo para su seguridad, la del personal o
          terceros.
        </Text>

        {/* Sección 8 */}
        <Text style={styles.sectionTitle}>
          8. Limitación de responsabilidad
        </Text>
        <Text style={styles.paragraph}>
          PAKU no será responsable por daños indirectos, incidentales o
          consecuentes derivados del uso del servicio, salvo aquellos
          expresamente establecidos por la ley aplicable. El servicio se presta
          bajo estándares profesionales y protocolos de cuidado orientados al
          bienestar de la mascota.
        </Text>

        {/* Sección 9 */}
        <Text style={styles.sectionTitle}>9. Situación no prevista</Text>
        <Text style={styles.paragraph}>
          PAKU no será responsable por la imposibilidad de prestar el servicio
          cuando esta se deba a causas de fuerza mayor o caso fortuito, tales
          como desastres naturales, restricciones de tránsito, emergencias
          sanitarias u otras situaciones ajenas a su control razonable.
        </Text>

        {/* Sección 10 */}
        <Text style={styles.sectionTitle}>
          10. Uso de imágenes y contenido audiovisual
        </Text>
        <Text style={styles.paragraph}>
          El usuario autoriza a PAKU a utilizar fotografías y/o videos de su
          mascota captados durante la prestación del servicio únicamente con
          fines de marketing, comunicación y promoción de la marca, garantizando
          siempre un uso respetuoso y profesional. En caso de no desear dicho
          uso, el usuario podrá comunicarlo a través de los canales oficiales de
          la aplicación.
        </Text>

        {/* Sección 11 */}
        <Text style={styles.sectionTitle}>11. Modificaciones del servicio</Text>
        <Text style={styles.paragraph}>
          PAKU podrá modificar, actualizar o suspender funcionalidades del
          servicio con fines operativos, de mejora continua o de seguridad.
        </Text>

        {/* Sección 12 */}
        <Text style={styles.sectionTitle}>
          12. Actualización de los términos y condiciones
        </Text>
        <Text style={styles.paragraph}>
          Estos términos y condiciones podrán ser actualizados periódicamente.
          El uso continuo de la aplicación implica la aceptación de los cambios
          realizados.
        </Text>

        {/* Sección 13 */}
        <Text style={styles.sectionTitle}>
          13. Jurisdicción y ley aplicable
        </Text>
        <Text style={styles.paragraph}>
          Estos términos y condiciones se rigen por las leyes de la República
          del Perú. Cualquier controversia será resuelta por los tribunales
          competentes de la ciudad de Lima, Perú.
        </Text>

        {/* Sección 14 */}
        <Text style={styles.sectionTitle}>14. Libro de Reclamaciones</Text>
        <Text style={[styles.paragraph, { marginBottom: 60 }]}>
          El usuario puede registrar reclamos o quejas desde la sección Ayuda y
          soporte de la aplicación. PAKU responderá dentro del plazo legal de 30
          días calendario, sin que ello implique aceptación del reclamo ni
          obligación de reembolso, salvo disposición legal expresa.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
