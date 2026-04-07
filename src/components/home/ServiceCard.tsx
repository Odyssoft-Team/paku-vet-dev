// components/home/ServiceCard.tsx
import React from "react";
import { View, ImageBackground, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Text } from "../common/Text";

interface ServiceCardProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  onPress: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  subtitle,
  imageUrl,
  onPress,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      height: 140,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      ...Shadows.md,
    },
    image: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    title: {
      fontSize: Typography.fontSize.xl,
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
  });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <ImageBackground
        source={
          imageUrl
            ? { uri: imageUrl }
            : require("@assets/images/home/Spa-Paku.png")
        }
        style={styles.image}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text variant="bold" style={styles.title}>
            {title}
          </Text>
          <Text variant="regular" style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
};
