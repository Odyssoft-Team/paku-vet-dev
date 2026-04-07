import React from "react";
import {
  View,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Text } from "../common/Text";

interface OfferCardProps {
  discount: string;
  description: string;
  imageUrl?: string;
  onPress: () => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  discount,
  description,
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
    content: {
      flex: 1,
      // backgroundColor: colors.primary,
      padding: Spacing.lg,
      justifyContent: "center",
    },
    discount: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFD700",
      // marginBottom: Spacing.xs,
    },
    description: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFFFFF",
    },
    code: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: "#FFFFFF",
      opacity: 0.8,
      marginTop: Spacing.sm,
    },
    title: {
      fontSize: Typography.fontSize.xxxl,
      color: "#FFFFFF",
    },
    title2: {
      fontSize: Typography.fontSize.lg,
      color: "#FFFFFF",
    },
    subtitle: {
      fontSize: Typography.fontSize.sm,
      color: "#FFFFFF",
      marginTop: Spacing.sm,
    },
  });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <ImageBackground
        source={require("@assets/images/home/Cupon-Paku.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text style={styles.discount}>{discount}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.code}>Código: PAKU-DIC</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
};
