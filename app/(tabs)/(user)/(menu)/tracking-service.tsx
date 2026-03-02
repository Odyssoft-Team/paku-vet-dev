import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useTheme } from "@/hooks";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { View, Text, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon } from "@/components/common";
import { OrderProgressBar } from "@/components/common/OrdenProgressBar";
import { useOrderStore } from "@/store/orderStore";

// ... mismos imports

export default function TrackingServiceScreen() {
  const driverImage = null;
  const driverName = "David";
  const { colors } = useTheme();

  // Order store
  const { order } = useOrderStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    driverRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    avatarPlaceholder: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: Spacing.md,
    },
    initials: {
      color: "#FFF",
      fontSize: 24,
      fontWeight: "bold",
    },
    infoContainer: {
      flex: 1,
    },
    titleDriver: {
      fontSize: Typography.fontSize.sm,
      fontWeight: "bold",
      color: colors.primary,
    },
    textDriver: {
      fontSize: Typography.fontSize.xs,
      color: colors.primary,
      lineHeight: 18,
    },
    ratingBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E8FBF2",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.xl,
      alignSelf: "flex-start",
    },
    ratingText: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#4ADE80",
      marginRight: 4,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Rastrear"
        backHref="/(tabs)/(user)/"
        right={{ type: "none" }}
      />

      {/* Contenido principal (Mapa, etc) */}
      <View style={{ flex: 1 }} />

      {/* Footer Fijo */}
      <View style={styles.fixedButton}>
        {/* Sección del Conductor Corregida */}
        <View style={styles.driverRow}>
          {driverImage ? (
            <Image
              source={{ uri: driverImage }}
              style={styles.avatarPlaceholder}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initials}>
                {driverName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.titleDriver}>{driverName}</Text>
            <Text style={styles.textDriver}>Honda Civic Azul</Text>
            <Text style={styles.textDriver}>5JFDKLA</Text>
          </View>

          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>4.8</Text>
            <Icon name="start" size={14} color="#4ADE80" />
          </View>
        </View>

        {/* Barra de progreso */}
        <View style={{ marginVertical: Spacing.sm }}>
          {order && order.status !== "done" && order.status !== "cancelled" && (
            <OrderProgressBar currentStatus={order.status} />
          )}
        </View>

        <Button
          title="Reprogramar"
          textStyle={{ fontSize: Typography.fontSize.xs }}
          style={{
            borderRadius: BorderRadius.lg,
            paddingVertical: 14,
            marginTop: Spacing.sm,
          }}
          onPress={() => {}}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
