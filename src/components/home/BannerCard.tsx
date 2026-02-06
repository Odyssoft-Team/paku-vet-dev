import React from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

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
      borderRadius: BorderRadius.xl,
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
      fontWeight: Typography.fontWeight.bold,
      color: "#FFFFFF",
      marginBottom: Spacing.xs,
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
        source={{
          uri:
            imageUrl ||
            "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800",
        }}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(29, 42, 216, 0.6)", "rgba(29, 42, 216, 0.9)"]}
          style={styles.gradient}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};
