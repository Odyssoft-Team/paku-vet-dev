import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useSpaServices } from "@/hooks/useSpaceServices";
import { useBookingStore } from "@/store/bookingStore";

interface ServicePackageProps {
  title: string;
  subtitle: string;
  price: string;
  badge?: string;
  badgeColor?: string;
  includes: string[];
  onPress: () => void;
}

const ServicePackage: React.FC<ServicePackageProps> = ({
  title,
  subtitle,
  price,
  badge,
  badgeColor,
  includes,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.packageCard, { backgroundColor: colors.surface }]}>
      <ImageBackground
        source={require("@assets/images/profile/profile-pet.png")}
        style={styles.packageBackground}
        imageStyle={styles.packageBackgroundImage}
      >
        <View style={styles.packageOverlay} />
      </ImageBackground>

      <View style={styles.packageContent}>
        {/* Header */}
        <View style={styles.packageHeader}>
          <View style={styles.packageTitleContainer}>
            <Text style={[styles.packageTitle, { color: colors.primary }]}>
              {title}
            </Text>
            {badge && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: badgeColor || colors.secondary },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {badge}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.packageSubtitle, { color: colors.text }]}>
            {subtitle}
          </Text>
        </View>

        {/* Price */}
        <Text style={[styles.packagePrice, { color: colors.primary }]}>
          Costo: {price}
        </Text>

        {/* Includes */}
        <View style={styles.includesContainer}>
          <Text style={[styles.includesTitle, { color: colors.text }]}>
            Incluye:
          </Text>
          {includes.map((item, index) => (
            <Text
              key={index}
              style={[styles.includesItem, { color: colors.text }]}
            >
              • {item}
            </Text>
          ))}
        </View>

        {/* Button */}
        <Button title="Elegir este spa" onPress={onPress} fullWidth />
      </View>
    </View>
  );
};

const getBadgeData = (index: number) => {
  const badges = [
    { text: "Recomendado", color: "#FFB6C1" }, // Para el index 0
    { text: "Más lujo", color: "#FFB6C1" }, // Para el index 1
    { text: "Cachorro", color: "#FFB6C1" }, // Para el index 2
  ];
  return badges[index] || null;
};

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const { data: packages, isLoading } = useSpaServices();
  const { setService } = useBookingStore();

  const handleSelectPackage = (packageCode: string) => {
    const pkg = packages?.find((p) => p.code === packageCode);
    if (pkg) {
      setService({
        serviceCode: pkg.code,
        serviceName: pkg.name,
        servicePrice: pkg.price,
      });
    }
    router.push("/(tabs)/(user)/service-selected");
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Cargando experiencias spa...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/(user)/select-pet")}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servicios</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceMainTitle, { color: colors.primary }]}>
            PAKU Spa
          </Text>
          <Text style={[styles.serviceDescription, { color: colors.text }]}>
            Cuidado profesional, seguimiento en vivo y total transparencia desde
            tu app.
          </Text>
        </View>

        {/* Packages */}
        {packages?.map((pkg, index) => {
          const badgeInfo = getBadgeData(index);

          return (
            <ServicePackage
              key={pkg.code}
              title={pkg.name}
              subtitle={pkg.description}
              price={`${pkg.currency} ${pkg.price.toFixed(2)}`}
              includes={pkg.includes}
              badge={badgeInfo?.text}
              badgeColor={badgeInfo?.color}
              onPress={() => handleSelectPackage(pkg.code)}
            />
          );
        })}
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  serviceInfo: {
    marginBottom: Spacing.lg,
  },
  serviceMainTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  serviceDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  packageCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  packageBackground: {
    width: "100%",
    height: 120,
  },
  packageBackgroundImage: {
    opacity: 1,
  },
  packageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  packageContent: {
    padding: Spacing.lg,
  },
  packageHeader: {
    marginBottom: Spacing.sm,
  },
  packageTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    flexWrap: "wrap",
  },
  packageTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    marginRight: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  packageSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
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
});
