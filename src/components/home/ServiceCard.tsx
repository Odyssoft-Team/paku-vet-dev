import React from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";

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
      height: 150,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      ...Shadows.md,
    },
    content: {
      flex: 1,
      backgroundColor: colors.primary,
      padding: Spacing.lg,
      justifyContent: "flex-end",
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: "#FFFFFF",
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: Typography.fontSize.sm,
      color: "#FFFFFF",
      opacity: 0.9,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{
          uri:
            imageUrl ||
            "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=800",
        }}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};
