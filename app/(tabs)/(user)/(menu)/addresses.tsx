import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useTheme } from "@/hooks/useTheme";
import { useAddressStore } from "@/store/addressStore";
import { useCartDrawerStore } from "@/store/cartDrawerStore";
import { Address } from "@/types/address.types";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";

// ─── Address Options Drawer ────────────────────────────────────────────────────

interface AddressDrawerProps {
  address: Address | null;
  onClose: () => void;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
}

const AddressDrawer: React.FC<AddressDrawerProps> = ({
  address,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();

  // Animaciones separadas: fade para el overlay, slide para el contenido
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (address) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animar hacia afuera y luego ocultar el modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false));
    }
  }, [address]);

  const handleClose = () => {
    // Primero anima, luego notifica al padre
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  const label = address
    ? `${address.address_line}${address.building_number ? ` ${address.building_number}` : ""}`
    : "";
  const shortLabel = label.length > 32 ? label.slice(0, 32) + "…" : label;

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
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl + Spacing.md,
      paddingHorizontal: Spacing.lg,
      ...Shadows.lg,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: Spacing.md,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.lg,
    },
    drawerTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
      flex: 1,
      paddingRight: Spacing.sm,
    },
    closeBtn: {
      padding: Spacing.xs,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    optionIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    optionLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.medium,
    },
    optionDivider: {
      height: 1,
      backgroundColor: colors.border + "40",
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Overlay con fade */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
          {/* Drawer con slide desde abajo */}
          <TouchableWithoutFeedback>
            <Animated.View
              style={[s.drawer, { transform: [{ translateY: slideAnim }] }]}
            >
              <View style={s.handle} />

              {/* Título + cerrar */}
              <View style={s.topRow}>
                <Text style={s.drawerTitle}>{shortLabel}</Text>
                <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
                  <Icon name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Opción: Editar */}
              <TouchableOpacity
                style={s.option}
                onPress={() => address && onEdit(address)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.optionIconWrapper,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Icon name="pencil" size={18} color={colors.primary} />
                </View>
                <Text style={[s.optionLabel, { color: colors.text }]}>
                  Editar dirección
                </Text>
              </TouchableOpacity>

              <View style={s.optionDivider} />

              {/* Opción: Eliminar */}
              <TouchableOpacity
                style={s.option}
                onPress={() => address && onDelete(address)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.optionIconWrapper,
                    { backgroundColor: colors.error + "15" },
                  ]}
                >
                  <Icon name="close" size={18} color={colors.error} />
                </View>
                <Text style={[s.optionLabel, { color: colors.error }]}>
                  Eliminar dirección
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ─── Address Card ──────────────────────────────────────────────────────────────

interface AddressCardProps {
  address: Address;
  onOptionsPress: (address: Address) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onOptionsPress,
}) => {
  const { colors } = useTheme();

  const typeLabel = address.label || address.type || "Casa";
  const fullAddress = [
    address.address_line,
    address.building_number,
    address.apartment_number,
  ]
    .filter(Boolean)
    .join(", ");

  const s = StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      gap: Spacing.md,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
    },
    typeLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.medium,
      color: colors.textSecondary,
      marginBottom: 2,
      textTransform: "capitalize",
    },
    addressText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: colors.text,
      lineHeight: 20,
    },
    reference: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    optionsBtn: {
      padding: Spacing.sm,
    },
    dotMenu: {
      gap: 3,
      alignItems: "center",
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.textSecondary,
    },
  });

  return (
    <View style={s.card}>
      {/* Icono */}
      <View style={s.iconWrapper}>
        <Icon name="gps" size={20} color={colors.primary} />
      </View>

      {/* Contenido */}
      <View style={s.content}>
        <Text style={s.typeLabel}>{typeLabel}</Text>
        <Text style={s.addressText} numberOfLines={2}>
          {fullAddress}
        </Text>
        {address.reference && (
          <Text style={s.reference} numberOfLines={1}>
            {address.reference}
          </Text>
        )}
      </View>

      {/* Tres puntitos */}
      <TouchableOpacity
        style={s.optionsBtn}
        onPress={() => onOptionsPress(address)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={s.dotMenu}>
          <View style={s.dot} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function AddressesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addresses, isLoading, fetchAddresses, deleteAddress } =
    useAddressStore();
  const { open: openCartDrawer } = useCartDrawerStore();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  };

  const handleOptionsPress = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleCloseDrawer = () => {
    setSelectedAddress(null);
  };

  const handleEdit = (address: Address) => {
    setSelectedAddress(null);
    // TODO: navegar a pantalla de edición con datos precargados
    // router.push({ pathname: "/(tabs)/(user)/edit-address", params: { id: address.id } });
  };

  const handleDelete = async (address: Address) => {
    setSelectedAddress(null);
    // Pequeño delay para que el drawer se cierre antes del alert
    setTimeout(async () => {
      try {
        await deleteAddress(address.id);
        await fetchAddresses();
      } catch (e) {
        console.error("Error deleting address:", e);
      }
    }, 350);
  };

  const defaultAddress = addresses.find((a) => a.is_default);
  const otherAddresses = addresses.filter((a) => !a.is_default);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 100 },

    // Sección
    sectionLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text,
      marginHorizontal: Spacing.md,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    sectionCard: {
      marginHorizontal: Spacing.md,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      ...Shadows.sm,
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.border + "40",
      marginLeft: 72, // alinea con el texto
    },

    // Estado vacío
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      paddingHorizontal: Spacing.xl,
    },
    emptyIconWrapper: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    emptyTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.text,
      textAlign: "center",
      marginBottom: Spacing.xs,
    },
    emptySubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },

    // Botón fijo
    fixedBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border + "30",
      ...Shadows.lg,
    },
  });

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScreenHeader
        title="Mis direcciones"
        backHref="/(tabs)/(user)/profile"
        right={{
          type: "icon",
          name: "cart",
          onPress: openCartDrawer,
        }}
      />

      {isLoading && addresses.length === 0 ? (
        <View style={s.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.scrollContent,
            addresses.length === 0 && { flex: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {addresses.length === 0 ? (
            /* ── Estado vacío ───────────────────────────────────────────── */
            <View style={s.emptyContainer}>
              <View style={s.emptyIconWrapper}>
                <Icon name="gps" size={32} color={colors.primary} />
              </View>
              <Text style={s.emptyTitle}>Sin direcciones</Text>
              <Text style={s.emptySubtitle}>
                Agrega una dirección para que podamos llegar a ti fácilmente.
              </Text>
            </View>
          ) : (
            <>
              {/* ── Dirección por defecto ──────────────────────────────── */}
              {defaultAddress && (
                <>
                  <Text style={s.sectionLabel}>
                    Dirección de entrega actual
                  </Text>
                  <View style={s.sectionCard}>
                    <AddressCard
                      address={defaultAddress}
                      onOptionsPress={handleOptionsPress}
                    />
                  </View>
                </>
              )}

              {/* ── Otras direcciones ──────────────────────────────────── */}
              {otherAddresses.length > 0 && (
                <>
                  <Text style={s.sectionLabel}>Otras direcciones</Text>
                  <View style={s.sectionCard}>
                    {otherAddresses.map((addr, index) => (
                      <React.Fragment key={addr.id}>
                        <AddressCard
                          address={addr}
                          onOptionsPress={handleOptionsPress}
                        />
                        {index < otherAddresses.length - 1 && (
                          <View style={s.cardDivider} />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Botón agregar dirección */}
      <View style={s.fixedBottom}>
        <Button
          title="Agregar dirección"
          onPress={() => router.push("/(screens)/add-address")}
          fullWidth
          style={{ borderRadius: BorderRadius.full }}
        />
      </View>

      {/* Drawer de opciones */}
      <AddressDrawer
        address={selectedAddress}
        onClose={handleCloseDrawer}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}
