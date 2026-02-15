import React from "react";
import {
  View,
  ImageBackground,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Text } from "../common/Text";

interface BannerBaseProps {
  title: string;
  subtitle: string;
  imageSource: ImageSourcePropType;
}

export const BannerBase: React.FC<BannerBaseProps> = ({
  title,
  subtitle,
  imageSource,
}) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={imageSource}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", "rgba(2, 19, 34, 0.46)"]}
          style={styles.gradient}
        ></LinearGradient>
      </ImageBackground>
    </View>
  );
};

// Estilos fuera del componente para evitar re-crearlos en cada render
const styles = StyleSheet.create({
  container: {
    height: 200,
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
