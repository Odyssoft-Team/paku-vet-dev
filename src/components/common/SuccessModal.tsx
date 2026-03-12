import React from "react";
import { Modal, View, StyleSheet, Pressable } from "react-native";
import { Text } from "@/components/common/Text";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography, Shadows } from "@/constants/theme";

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  onButtonPress: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  message,
  buttonText,
  onButtonPress,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.lg,
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      width: "100%",
      maxWidth: 340,
      alignItems: "center",
      ...Shadows.lg,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
      textAlign: "center",
      marginBottom: Spacing.sm,
    },
    message: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.xl,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <Icon name="check" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <Button title={buttonText} onPress={onButtonPress} fullWidth />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
