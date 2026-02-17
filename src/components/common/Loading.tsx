import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Image, Animated } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";
import { Text } from "./Text";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: "small" | "large";
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  fullScreen = false,
  size = "large",
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [scaleAnim]);

  const styles = StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      ...(fullScreen && {
        flex: 1,
        backgroundColor: colors.background,
      }),
    },
    logoContainer: {
      transform: [{ scaleX: scaleAnim }, { scaleY: scaleAnim }],
      marginBottom: Spacing.md,
    },
    logo: {
      width: 240,
      height: 140,
      resizeMode: "contain",
    },
    message: {
      marginTop: Spacing.md,
      fontSize: Typography.fontSize.md,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View style={styles.logoContainer}>
        {isDark ? (
          <Image
            source={require("@assets/images/logo/logo-mono-dark.png")}
            style={styles.logo}
          />
        ) : (
          <Image
            source={require("@assets/images/logo/logo-color.png")}
            style={styles.logo}
          />
        )}
      </Animated.View>
      {/* {message && (
        <Text variant="medium" style={styles.message}>
          {message}
        </Text>
      )} */}
    </View>
  );
};
