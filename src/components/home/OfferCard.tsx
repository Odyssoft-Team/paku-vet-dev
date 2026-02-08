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
          <Text variant="black" style={styles.title}>
            20% OFF {"\n"}
            <Text variant="semibold" style={styles.title2}>
              en tu primer PAKU Spa
            </Text>
          </Text>
          <Text variant="regular" style={styles.subtitle}>
            Se aplica con el código PAKU-DIC.
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
};
