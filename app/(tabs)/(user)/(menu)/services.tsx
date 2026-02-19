import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { ServiceCard } from "@/components/home";

interface ServiceCardProps {
  title: string;
  subtitle: string;
  image: any;
  onPress: () => void;
}

export default function ServicesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleServicePress = () => {
    router.push("/(tabs)/(user)/select-pet");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/(user)/")}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuestros servicios</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ServiceCard
          title="PAKU Spa"
          subtitle="Grooming inteligente."
          onPress={handleServicePress}
        />

        {/* Aquí irán más servicios en el futuro */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    textAlign: "center",
  },
  scrollContent: {
    padding: Spacing.md,
  },
  serviceCard: {
    height: 160,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  serviceImageStyle: {
    borderRadius: BorderRadius.xl,
  },
  serviceOverlay: {
    flex: 1,
    backgroundColor: "rgba(29, 42, 216, 0.7)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  serviceTitle: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  serviceSubtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: "#FFFFFF",
  },
});
