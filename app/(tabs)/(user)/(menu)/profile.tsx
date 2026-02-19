import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { AvatarPicker } from "@/components/common/AvatarPicker";
import { ImagePickerModal } from "@/components/common/ImagePickerModal";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useAddressStore } from "@/store/addressStore";

interface MenuItemProps {
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  textColor?: string;
  icon?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  onPress,
  showArrow = true,
  textColor,
  icon,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <Text
        style={[styles.menuItemText, { color: textColor || colors.primary }]}
      >
        {label}
      </Text>
      {icon ||
        (showArrow && (
          <Icon name="arrow-right" size={20} color={colors.primary} />
        ))}
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { addresses } = useAddressStore();
  const { colors, isDark, toggleColorScheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const defaultAddress = addresses.find((addr) => addr.is_default);

  const handleTakePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitas dar permiso para usar la cámara",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        setImagePickerVisible(false);
        // TODO: Subir foto al servidor
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitas dar permiso para acceder a la galería",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        setImagePickerVisible(false);
        // TODO: Subir foto al servidor
      }
    } catch (error) {
      console.error("Error picking image:", error);
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            console.log("Delete account");
            // TODO: Implementar eliminación de cuenta
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            <AvatarPicker
              imageUri={avatarUri}
              onImageSelected={() => setImagePickerVisible(true)}
              size={80}
            />
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {`${user?.first_name} ${user?.last_name}` || "Usuario"}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email || "correo@ejemplo.com"}
            </Text>
            <Text style={[styles.userAddress, { color: colors.textSecondary }]}>
              {defaultAddress?.address_line} {defaultAddress?.building_number}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => console.log("Edit profile")}
          >
            <Icon name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <MenuItem
            label="Preferencias"
            onPress={() => router.push("/(tabs)/(user)/preferences")}
            icon={
              <View style={styles.preferenceRight}>
                <Text
                  style={[styles.themeText, { color: colors.textSecondary }]}
                >
                  {isDark ? "Modo oscuro" : "Modo claro"}
                </Text>
              </View>
            }
            showArrow={false}
          />

          <MenuItem
            label="Pagos y facturación"
            onPress={() => router.push("/(tabs)/(user)/payments")}
          />

          <MenuItem
            label="Ayuda y soporte"
            onPress={() => router.push("/(tabs)/(user)/support")}
          />

          <MenuItem
            label="Información legal"
            onPress={() => router.push("/(tabs)/(user)/legal")}
          />

          <MenuItem
            label="Libro de reclamaciones"
            onPress={() => router.push("/(tabs)/(user)/complaints")}
          />

          <MenuItem
            label="Cerrar sesión"
            onPress={handleLogout}
            showArrow={false}
            icon={<Icon name="logout" size={20} color={colors.primary} />}
          />

          <MenuItem
            label="Eliminar cuenta"
            onPress={handleDeleteAccount}
            showArrow={false}
            textColor={colors.error}
          />
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onTakePhoto={handleTakePhoto}
        onPickImage={handlePickImage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: Spacing.md,
    width: 40,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    textAlign: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.xs,
  },
  userAddress: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 16,
  },
  editButton: {
    padding: Spacing.sm,
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
  },
  menuContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
    marginBottom: Spacing.md,
  },
  menuItemText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    flex: 1,
  },
  preferenceRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
