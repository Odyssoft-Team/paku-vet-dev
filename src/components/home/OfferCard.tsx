import React from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

interface OfferCardProps {
  discount: string;
  description: string;
  imageUrl?: string;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  discount,
  description,
  imageUrl,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      height: 120,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      flexDirection: "row",
    },
    contentContainer: {
      flex: 1,
      backgroundColor: colors.secondary,
      padding: Spacing.md,
      justifyContent: "center",
    },
    discount: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    description: {
      fontSize: Typography.fontSize.sm,
      color: colors.primary,
    },
    imageContainer: {
      width: 120,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.discount}>{discount}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <ImageBackground
        source={{
          uri:
            imageUrl ||
            "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400",
        }}
        style={styles.imageContainer}
        resizeMode="cover"
      />
    </View>
  );
};
