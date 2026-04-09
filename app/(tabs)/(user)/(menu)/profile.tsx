import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon, IconName } from "@/components/common/Icon";
import { AvatarPicker } from "@/components/common/AvatarPicker";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useAddressStore } from "@/store/addressStore";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useCartDrawerStore } from "@/store/cartDrawerStore";
import { mediaService } from "@/api/services/media.service";
import { useUploadPhoto } from "@/hooks/useUploadPhoto";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MenuItemProps {
  label: string;
  onPress: () => void;
  icon: IconName;
  iconColor?: string;
  labelColor?: string;
  rightElement?: React.ReactNode;
}

// ─── MenuItem ──────────────────────────────────────────────────────────────────

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  onPress,
  icon,
  iconColor,
  labelColor,
  rightElement,
}) => {
  const { colors } = useTheme();
  const ic = iconColor ?? colors.primary;

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: ic + "18" }]}>
        <Icon name={icon} size={18} color={ic} />
      </View>
      <Text style={[styles.menuLabel, { color: labelColor ?? colors.text }]}>
        {label}
      </Text>
      {rightElement ?? (
        <Icon name="arrow-right" size={12} color={colors.border} />
      )}
    </TouchableOpacity>
  );
};

// ─── SectionHeader ─────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string }> = ({ title }) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, logout, refreshUser } = useAuthStore();
  const { addresses, fetchAddresses } = useAddressStore();
  const { open: openCartDrawer } = useCartDrawerStore();
  const { uploadPhoto, isUploading } = useUploadPhoto();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const defaultAddress = addresses.find((addr) => addr.is_default);

  // Carga inicial — siempre traer datos frescos del servidor al entrar al perfil
  useEffect(() => {
    Promise.all([refreshUser(), fetchAddresses()]);
  }, []);

  // Pull-to-refresh — recarga el user del backend y refresca la foto
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshUser(), fetchAddresses()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Cargar foto — se dispara cuando llega el user (id) o cambia su foto
  useEffect(() => {
    const loadPhoto = async () => {
      if (!user?.profile_photo_url) {
        setAvatarUri(null);
        return;
      }
      try {
        setIsLoadingPhoto(true);
        const readUrl = await mediaService.getSignedReadUrl(
          user.profile_photo_url,
        );
        setAvatarUri(readUrl);
      } catch (err) {
        console.log("[Profile] Error cargando foto:", err);
      } finally {
        setIsLoadingPhoto(false);
      }
    };

    loadPhoto();
  }, [user?.id, user?.profile_photo_url]);

  // Subir nueva foto y actualizar la vista
  const handlePhotoSelected = async (uri: string, mimeType: string) => {
    if (!user?.id) return;

    try {
      // Optimistic update — mostrar la foto local de inmediato
      setAvatarUri(uri);
      const { readUrl } = await uploadPhoto("user", user.id, uri, mimeType);
      // Reemplazar con la URL firmada real del servidor
      setAvatarUri(readUrl);
    } catch (err) {
      console.log("Error subiendo foto:", err);
      setAvatarUri(null);
      Alert.alert("Error", "No se pudo subir la foto. Intenta de nuevo.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader
        title="Mi perfil"
        backHref="/(tabs)/(user)/"
        right={{
          type: "icon",
          name: "cart",
          onPress: openCartDrawer,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Tarjeta de usuario ──────────────────────────────────────────── */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          {/* Avatar */}
          <AvatarPicker
            imageUri={avatarUri}
            onImageSelected={handlePhotoSelected}
            size={72}
            isLoading={isUploading || isLoadingPhoto}
            containerStyle={{ marginVertical: 0 }}
          />

          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
            {defaultAddress && (
              <View style={styles.addressRow}>
                <Icon name="gps" size={12} color={colors.textSecondary} />
                <Text
                  style={[styles.userAddress, { color: colors.textSecondary }]}
                >
                  {defaultAddress.address_line} {defaultAddress.building_number}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.primary + "15" }]}
            onPress={() => {}}
          >
            <Icon name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Sección: Mi cuenta ──────────────────────────────────────────── */}
        <SectionHeader title="Mi cuenta" />
        <View style={styles.section}>
          <MenuItem
            label="Mis mascotas"
            icon="pets"
            onPress={() => router.push("/(tabs)/(user)/pets")}
          />
          <View style={[styles.divider, { backgroundColor: colors.shadow }]} />
          {/* <MenuItem label="Mis reservas" icon="calendar" onPress={() => {}} />
          <View style={[styles.divider, { backgroundColor: colors.shadow }]} /> */}
          <MenuItem
            label="Mis direcciones"
            icon="gps"
            onPress={() => router.push("/(tabs)/(user)/addresses")}
          />
        </View>

        {/* ── Sección: Actividad ──────────────────────────────────────────── */}
        <SectionHeader title="Actividad" />
        <View style={styles.section}>
          <MenuItem
            label="Mis pedidos"
            icon="services"
            onPress={() => router.push("/(tabs)/(user)/(menu)/my-orders")}
          />
          <View style={[styles.divider, { backgroundColor: colors.shadow }]} />
          <MenuItem
            label="Pagos y facturación"
            icon="wallet"
            onPress={() => router.push("/(tabs)/(user)/payments")}
          />
          <View style={[styles.divider, { backgroundColor: colors.shadow }]} />
          <MenuItem
            label="Mis tarjetas"
            icon="wallet"
            onPress={() => router.push("/(tabs)/(user)/my-cards")}
          />
          <View style={[styles.divider, { backgroundColor: colors.shadow }]} />
          {/* <MenuItem label="Mis cupones" icon="ticket" onPress={() => {}} />
          <View style={[styles.divider, { backgroundColor: colors.shadow }]} /> */}
          {/* <MenuItem
            label="Notificaciones"
            icon="notification"
            onPress={() => router.push("/(tabs)/(user)/notifications")}
          /> */}
        </View>

        {/* ── Sección: Configuración ──────────────────────────────────────── */}
        <SectionHeader title="Configuración" />
        <View style={styles.section}>
          <MenuItem
            label="Preferencias"
            icon="services"
            onPress={() => router.push("/(tabs)/(user)/preferences")}
            rightElement={
              <Text
                style={[
                  styles.preferenceValue,
                  { color: colors.textSecondary },
                ]}
              >
                {isDark ? "Modo oscuro" : "Modo claro"}
              </Text>
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.shadow }]} />
          <MenuItem
            label="Ayuda y soporte"
            icon="chat"
            onPress={() => router.push("/(tabs)/(user)/support")}
          />
          <View style={[styles.divider, { backgroundColor: colors.shadow }]} />
          <MenuItem
            label="Información legal"
            icon="file"
            onPress={() => router.push("/(tabs)/(user)/legal")}
          />
          <View style={[styles.divider, { backgroundColor: colors.shadow }]} />
          <MenuItem
            label="Libro de reclamaciones"
            icon="send"
            onPress={() => router.push("/(tabs)/(user)/complaints")}
          />
        </View>

        {/* ── Sección: Sesión ─────────────────────────────────────────────── */}
        <SectionHeader title="Sesión" />
        <View style={styles.section}>
          <MenuItem
            label="Cerrar sesión"
            icon="logout"
            iconColor={colors.textSecondary}
            onPress={handleLogout}
            rightElement={<View />}
          />
        </View>

        <Text style={[styles.version, { color: colors.border }]}>
          Paku v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Tarjeta de usuario ────────────────────────────────────────────────────
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  userAddress: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  // ── Secciones ─────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  divider: {
    height: 1,
    width: "100%",
  },

  // ── MenuItem ──────────────────────────────────────────────────────────────
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  preferenceValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },

  // ── Versión ───────────────────────────────────────────────────────────────
  version: {
    textAlign: "center",
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.xl,
  },
});
