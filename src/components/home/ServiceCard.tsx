import React from "react";
import {
  View,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
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
      height: 160,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      ...Shadows.md,
    },
    content: {
      flex: 1,
      // backgroundColor: colors.primary,
      padding: Spacing.lg,
      justifyContent: "flex-end",
    },
    title: {
      fontSize: Typography.fontSize.xxxl,
      color: "#FFFFFF",
    },
    subtitle: {
      fontSize: Typography.fontSize.lg,
      color: "#FFFFFF",
    },
  });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <ImageBackground
        source={require("@assets/images/home/Spa-Paku.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text variant="black" style={styles.title}>
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
