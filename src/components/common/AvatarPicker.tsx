import React, { useState } from "react";
import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Icon } from "./Icon";
import { ImagePickerModal } from "./ImagePickerModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Shadows } from "@/constants/theme";

interface AvatarPickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string, mimeType: string) => void;
  size?: number;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  imageUri,
  onImageSelected,
  size,
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

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert("Se necesitan permisos para acceder a las fotos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onImageSelected(asset.uri, asset.mimeType ?? "image/jpeg");
      setModalVisible(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert("Se necesitan permisos para usar la cámara");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onImageSelected(asset.uri, asset.mimeType ?? "image/jpeg");
      setModalVisible(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      marginVertical: Spacing.md,
    },
    avatarContainer: {
      width: size || 120,
      height: size || 120,
      borderRadius: 60,
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
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <Icon name="camera" size={35} color={colors.surface} />
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
