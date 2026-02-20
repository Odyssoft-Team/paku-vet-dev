import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "./Text";
import { Icon, IconName } from "./Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";

// ─── Types ─────────────────────────────────────────────────────────────────────

type RightAction =
  | { type: "icon"; name: IconName; onPress: () => void; badge?: number }
  | { type: "text"; label: string; onPress: () => void }
  | { type: "none" };

interface ScreenHeaderProps {
  title: string;
  /** Ruta exacta a la que navega el botón atrástyles. Si se omite usa router.back() */
  backHref?: string;
  /** Qué mostrar a la derecha. Por defecto "none" (spacer invisible) */
  right?: RightAction;
  /** Override del color de fondo. Por defecto colorstyles.primary */
  backgroundColor?: string;
  style?: ViewStyle;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  backHref,
  right = { type: "none" },
  backgroundColor,
  style,
}) => {
  const router = useRouter();
  const { colors } = useTheme();

  const bgColor = backgroundColor ?? colors.primary;

  const handleBack = () => {
    if (backHref) {
      router.push(backHref as any);
    } else {
      router.back();
    }
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: bgColor,
      position: "relative",
    },
    backButton: {
      position: "absolute",
      left: Spacing.md,
      zIndex: 10,
      padding: Spacing.xs,
    },
    title: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
      // Evita que el título largo se solape con los botones absolutos
      maxWidth: "65%",
      includeFontPadding: false,
    },
    rightSlot: {
      position: "absolute",
      right: Spacing.md,
      zIndex: 10,
      padding: Spacing.xs,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: "#FFFFFF99",
    },
    badgeWrapper: {
      position: "relative",
    },
    badge: {
      position: "absolute",
      top: -4,
      right: -6,
      backgroundColor: "#EF4444",
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFF",
      lineHeight: 12,
    },
  });

  // ── Slot derecho ────────────────────────────────────────────────────────────
  const renderRight = () => {
    if (right.type === "none") {
      // Spacer invisible para que el título quede centrado
      return <View style={styles.rightSlot} pointerEvents="none" />;
    }

    if (right.type === "text") {
      return (
        <TouchableOpacity style={styles.rightSlot} onPress={right.onPress}>
          <Text style={styles.cancelText}>{right.label}</Text>
        </TouchableOpacity>
      );
    }

    if (right.type === "icon") {
      return (
        <TouchableOpacity style={styles.rightSlot} onPress={right.onPress}>
          <View style={styles.badgeWrapper}>
            <Icon name={right.name} size={22} color="#FFFFFF" />
            {right.badge != null && right.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {right.badge > 99 ? "99+" : right.badge}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={[styles.header, style]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Icon name="arrow-back" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {renderRight()}
    </View>
  );
};
