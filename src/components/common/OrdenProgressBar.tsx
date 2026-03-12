import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { Text } from "../common/Text";
import { useTheme } from "@/hooks/useTheme";
import { SERVICE_STATUS, STEPS } from "@/constants/service-status";
import { TypeStatus } from "@/types/order.types";

type StatusBar = {
  currentStatus: TypeStatus;
};

export const OrderProgressBar = ({ currentStatus }: StatusBar) => {
  const { colors } = useTheme();

  // Encontramos el índice actual
  const currentIndex =
    SERVICE_STATUS[currentStatus as keyof typeof SERVICE_STATUS] ?? 0;

  // Valor para la animación de pulso (escala y opacidad)
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Configuración del pulso infinito
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const pulseStyle = {
    transform: [
      {
        scale: pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.5],
        }),
      },
    ],
    opacity: pulseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    }),
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      paddingVertical: 5,
    },
    timelineContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    stepWrapper: {
      flex: 1,
      alignItems: "center",
      position: "relative",
    },
    stepLabel: {
      fontSize: 10,
      marginBottom: 6,
      textAlign: "center",
      color: "#A0A0A0",
    },
    nodeContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 20,
    },
    dotContainer: {
      width: 12,
      height: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      zIndex: 2,
    },
    pulseCircle: {
      position: "absolute",
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
      zIndex: 1,
    },
    line: {
      position: "absolute",
      height: 2,
      top: 9,
      left: "50%",
      width: "100%",
      zIndex: 0,
    },
    description: {
      fontSize: 10,
      fontStyle: "italic",
      marginTop: 8,
      paddingHorizontal: 10,
      color: colors.primary,
      opacity: 0.9,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.timelineContainer}>
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isCompleted = index <= currentIndex;
          const showLineCompleted = index < currentIndex;

          return (
            <View key={index} style={styles.stepWrapper}>
              <Text
                style={[
                  styles.stepLabel,
                  isCompleted && {
                    color: colors.primary,
                    fontFamily: "Poppins_600SemiBold",
                  },
                ]}
              >
                {step.label}
              </Text>

              <View style={styles.nodeContainer}>
                {/* Línea conectora */}
                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      {
                        backgroundColor: showLineCompleted
                          ? colors.primary
                          : "#D1D9E6",
                      },
                    ]}
                  />
                )}

                {/* Contenedor del punto y el pulso */}
                <View style={styles.dotContainer}>
                  {isCurrent && (
                    <Animated.View style={[styles.pulseCircle, pulseStyle]} />
                  )}
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isCompleted
                          ? colors.primary
                          : "#D1D9E6",
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.description}>{STEPS[currentIndex]?.desc}</Text>
    </View>
  );
};
