import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useCartDrawerStore } from "@/store/cartDrawerStore";
import { useBookingStore } from "@/store/bookingStore";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.45;

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { isOpen, close } = useCartDrawerStore();
  const { serviceName, servicePrice, extraLabel, extraPrice, couponDiscount } =
    useBookingStore();

  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const hasCart = serviceName != null;

  const subtotal = (servicePrice ?? 0) + (extraPrice ?? 0) - couponDiscount;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleGoToCart = () => {
    close();
    router.push("/(tabs)/(user)/cart");
  };

  const s = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    drawer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: BorderRadius.xxl,
      borderTopRightRadius: BorderRadius.xxl,
      height: DRAWER_HEIGHT,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
      ...Shadows.lg,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
      marginTop: Spacing.sm,
    },
    drawerTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
      includeFontPadding: false,
    },
    closeBtn: {
      padding: Spacing.xs,
      position: "absolute",
      top: 0,
      right: Spacing.xs,
    },

    // ── Estado vacío ───────────────────────────────────────────────────────
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    },
    emptyIconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 80,
      backgroundColor: colors.shadow,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    emptyTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
      textAlign: "center",
      includeFontPadding: false,
    },
    emptySubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: Spacing.md,
    },

    // ── Estado con carrito ─────────────────────────────────────────────────
    cartContainer: {
      flex: 1,
      gap: Spacing.sm,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
    },
    itemLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      flex: 1,
      paddingRight: Spacing.sm,
    },
    itemPrice: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border + "40",
      marginVertical: Spacing.xs,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
    },
    totalLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    totalValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    goToCartBtn: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
      alignItems: "center",
      marginTop: Spacing.sm,
    },
    goToCartText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFF",
    },
  });

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[s.drawer, { transform: [{ translateY: slideAnim }] }]}
            >
              {/* Header del drawer */}
              <View style={s.topRow}>
                <Text style={s.drawerTitle}>Tus carritos</Text>
                <TouchableOpacity style={s.closeBtn} onPress={close}>
                  <Icon name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* ── Sin carrito ──────────────────────────────────────── */}
              {!hasCart && (
                <View style={s.emptyContainer}>
                  <View style={s.emptyIconWrapper}>
                    <Icon name="cart" size={32} color={colors.border} />
                  </View>
                  <Text style={s.emptyTitle}>No tienes carritos creados</Text>
                  <Text style={s.emptySubtitle}>
                    Los carritos que armes quedarán listos para {"\n"} que
                    termines tu pedido.
                  </Text>
                </View>
              )}

              {/* ── Con carrito activo ───────────────────────────────── */}
              {hasCart && (
                <View style={s.cartContainer}>
                  {/* Servicio principal */}
                  <View style={s.itemRow}>
                    <Text style={s.itemLabel}>PAKU Spa · {serviceName}</Text>
                    <Text style={s.itemPrice}>
                      S/{servicePrice?.toFixed(2)}
                    </Text>
                  </View>

                  {/* Complemento (si existe) */}
                  {extraLabel && extraPrice != null && (
                    <View style={s.itemRow}>
                      <Text style={s.itemLabel}>{extraLabel}</Text>
                      <Text style={s.itemPrice}>S/{extraPrice.toFixed(2)}</Text>
                    </View>
                  )}

                  {/* Descuento cupón */}
                  {couponDiscount > 0 && (
                    <View style={s.itemRow}>
                      <Text style={[s.itemLabel, { color: colors.primary }]}>
                        Cupón aplicado
                      </Text>
                      <Text style={[s.itemPrice, { color: colors.primary }]}>
                        -S/{couponDiscount.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View style={s.divider} />

                  {/* Total */}
                  <View style={s.totalRow}>
                    <Text style={s.totalLabel}>Total</Text>
                    <Text style={s.totalValue}>S/{subtotal.toFixed(2)}</Text>
                  </View>

                  {/* Botón ir al carrito */}
                  <TouchableOpacity
                    style={s.goToCartBtn}
                    onPress={handleGoToCart}
                  >
                    <Text style={s.goToCartText}>Ir al carrito</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
