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
      height: 350,
      borderBottomEndRadius: BorderRadius.xxl,
      borderBottomStartRadius: BorderRadius.xxl,
      overflow: "hidden",
      marginBottom: Spacing.lg,
    },
    gradient: {
      flex: 1,
      padding: Spacing.lg,
      justifyContent: "flex-end",
    },
    title: {
      fontSize: Typography.fontSize.xxxxl,
      color: "#FFFFFF",
      marginBottom: Spacing.xs,
      lineHeight: 42,
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      color: "#FFFFFF",
      opacity: 0.9,
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
          <Text variant="black" style={styles.title}>
            {title}
          </Text>
          <Text variant="regular" style={styles.subtitle}>
            {subtitle}
          </Text>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};
