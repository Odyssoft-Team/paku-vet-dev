import React from "react";
import { View, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Text } from "../common/Text";

interface BannerCardProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
}

export const BannerCard: React.FC<BannerCardProps> = ({
  title,
  subtitle,
  imageUrl,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      height: 200,
      borderBottomEndRadius: BorderRadius.xl,
      borderBottomStartRadius: BorderRadius.xl,
      overflow: "hidden",
      marginBottom: Spacing.lg,
    },
    gradient: {
      flex: 1,
      padding: Spacing.lg,
      justifyContent: "flex-end",
    },
    title: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: "#FFFFFF",
      opacity: 0.9,
    },
    emoji: {
      fontSize: Typography.fontSize.xxl,
      marginBottom: Spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("@assets/images/home/home-paku.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(0, 33, 64, 0)", // Transparente arriba
            "rgba(0, 33, 64, 0.85)", // Medio transparente
          ]}
          style={styles.gradient}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={styles.emoji}>✨</Text>
            <Text variant="black" style={styles.title}>
              {title}
            </Text>
          </View>
          <Text variant="regular" style={styles.subtitle}>
            {subtitle}
          </Text>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};
