import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { File } from "expo-file-system/next";
import { Icon } from "./Icon";
import { ImagePickerModal } from "./ImagePickerModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Shadows } from "@/constants/theme";

interface AvatarPickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string, mimeType: string) => void;
  size?: number;
  /** Muestra un spinner encima del avatar (útil durante upload o carga) */
  isLoading?: boolean;
  /** Sobreescribe el estilo del View contenedor externo */
  containerStyle?: ViewStyle;
}

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
const MAX_DIMENSION = 1200; // px máximo en cualquier lado

async function getFileSize(uri: string): Promise<number> {
  try {
    const file = new File(uri);
    return file.size ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Comprime y redimensiona una imagen para que pese menos de 1MB.
 *   1. Redimensiona a máximo 1200px manteniendo aspecto.
 *   2. Comprime con quality=0.8.
 *   3. Si sigue pasando 1MB, reduce quality iterativamente hasta 0.4.
 */
async function compressImage(
  uri: string,
): Promise<{ uri: string; mimeType: string }> {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  if ((await getFileSize(resized.uri)) <= MAX_SIZE_BYTES) {
    return { uri: resized.uri, mimeType: "image/jpeg" };
  }

  for (const quality of [0.7, 0.6, 0.5, 0.4]) {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
    );
    if ((await getFileSize(compressed.uri)) <= MAX_SIZE_BYTES) {
      return { uri: compressed.uri, mimeType: "image/jpeg" };
    }
  }

  const fallback = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: fallback.uri, mimeType: "image/jpeg" };
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  imageUri,
  onImageSelected,
  size = 120,
  isLoading = false,
  containerStyle,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraStatus === "granted" && mediaStatus === "granted";
  };

  const handleAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      const { uri, mimeType } = await compressImage(asset.uri);
      onImageSelected(uri, mimeType);
    } catch {
      Alert.alert("Error", "No se pudo procesar la imagen. Intenta con otra.");
    } finally {
      setModalVisible(false);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Permiso denegado",
        "Se necesitan permisos para acceder a las fotos",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      await handleAsset(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Permiso denegado",
        "Se necesitan permisos para usar la cámara",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      await handleAsset(result.assets[0]);
    }
  };

  const iconSize = Math.round(size * 0.29); // ~35px para 120, ~21px para 72

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      marginVertical: Spacing.md,
    },
    avatarContainer: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: "#BFD0FE",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      ...Shadows.md,
    },
    avatar: {
      width: "100%",
      height: "100%",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => !isLoading && setModalVisible(true)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <Icon name="camera" size={iconSize} color={colors.surface} />
        )}
        {isLoading && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#FFFFFF" size="small" />
          </View>
        )}
      </TouchableOpacity>

      <ImagePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onTakePhoto={takePhoto}
        onPickImage={pickImage}
      />
    </View>
  );
};
