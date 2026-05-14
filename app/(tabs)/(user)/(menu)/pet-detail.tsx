import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Loading } from "@/components/common/Loading";
import { ImagePickerModal } from "@/components/common/ImagePickerModal";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { usePetStore } from "@/store/petStore";
import { useUploadPhoto } from "@/hooks/useUploadPhoto";
import { Pet } from "@/types/pet.types";
import { SALUD_LIST } from "@/constants/appointment";
import PetRecordCard from "@/components/pets/PetRecordCard";
import type { PetRecordOut } from "@/types/pet-record.types";
import { GROOMING_TYPES, HEALTH_TYPES } from "@/types/pet-record.types";
import { petRecordsService } from "@/api/services/pet-records.service";
import { translateBreed } from "@/constants/breed";

type TabType = "salud" | "historial" | "grooming";

// ─── EmptyTab ─────────────────────────────────────────────────────────────────

function EmptyTab({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{ alignItems: "center", paddingVertical: 60, gap: Spacing.sm }}
    >
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.bold,
          color: colors.text,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.regular,
          color: colors.textSecondary,
          textAlign: "center",
          maxWidth: 220,
          lineHeight: 20,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

export default function PetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { pets, updatePetPhoto } = usePetStore();
  const { uploadPhoto, isUploading } = useUploadPhoto();

  const [pet, setPet] = useState<Pet | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("salud");
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const [records, setRecords] = useState<PetRecordOut[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const petId = params.petId as string;

  useEffect(() => {
    const fetchRecords = async () => {
      if (!petId) return;
      setRecordsLoading(true);
      try {
        const data = await petRecordsService.list(petId);
        setRecords(data ?? []);
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404) {
          setRecords([]);
        } else {
          console.error(
            "[PetDetail] Error al cargar registros:",
            error?.message,
          );
        }
      } finally {
        setRecordsLoading(false);
      }
    };
    fetchRecords();
  }, [petId]);

  useEffect(() => {
    const foundPet = pets.find((p) => p.id === petId);
    if (foundPet) {
      setPet(foundPet);
    }
  }, [params.petId, pets]);

  const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();

    if (years === 0) {
      return `${months}m`;
    } else if (months < 0) {
      return `${years - 1}a`;
    } else {
      return `${years}a`;
    }
  };

  // Handler genérico — sube la foto a GCS y actualiza el store
  const handlePhotoSelected = async (uri: string, mimeType: string) => {
    if (!pet) return;
    setImagePickerVisible(false);

    // Optimistic update — muestra la foto local de inmediato
    setPet((prev) => (prev ? { ...prev, photo_url: uri } : prev));

    try {
      const { readUrl } = await uploadPhoto("pet", pet.id, uri, mimeType);
      // Actualizar con la signed read URL definitiva
      setPet((prev) => (prev ? { ...prev, photo_url: readUrl } : prev));
      updatePetPhoto(pet.id, readUrl);
    } catch {
      // Revertir al valor previo del store si falla
      const original = pets.find((p) => p.id === pet.id);
      setPet((prev) =>
        prev ? { ...prev, photo_url: original?.photo_url } : prev,
      );
      Alert.alert("Error", "No se pudo actualizar la foto. Intenta de nuevo.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitas dar permiso para usar la cámara",
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handlePhotoSelected(asset.uri, asset.mimeType ?? "image/jpeg");
      }
    } catch {
      Alert.alert("Error", "No se pudo tomar la foto");
    }
  };

  const handlePickImage = async () => {
    try {
      const { granted } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitas dar permiso para acceder a la galería",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handlePhotoSelected(asset.uri, asset.mimeType ?? "image/jpeg");
      }
    } catch {
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center", // Importante: ahora centramos el contenido
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md, // Este valor ahora controla la altura real
      backgroundColor: colors.primary,
      position: "relative", // Referencia para los hijos absolutos
    },
    backButton: {
      position: "absolute", // Sale del flujo, no ocupa espacio
      left: Spacing.md, // Se alinea a la izquierda
      zIndex: 10, // Para que siempre sea cliqueable
    },
    headerTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
    },
    cartButton: {
      position: "absolute", // Sale del flujo
      right: Spacing.md, // Se alinea a la derecha
      zIndex: 10,
    },
    bannerContainer: {
      height: 300,
      backgroundColor: colors.border,
      position: "relative",
      overflow: "hidden",
      borderBottomEndRadius: BorderRadius.xxl,
      borderBottomStartRadius: BorderRadius.xxl,
    },
    bannerImage: {
      width: "100%",
      height: "100%",
    },
    bannerPlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary + "20",
    },
    bannerEmoji: {
      fontSize: 120,
    },
    bannerGradient: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "flex-end",
      padding: Spacing.lg,
    },
    genderBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      ...Shadows.md,
      marginBottom: Spacing.sm,
    },
    genderIcon: {
      fontSize: 24,
      color: "#FFFFFF",
    },
    editButton: {
      position: "absolute",
      bottom: Spacing.lg,
      right: Spacing.lg,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      ...Shadows.lg,
    },
    petName: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textShadowColor: "rgba(0, 0, 0, 0.75)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    petInfo: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.regular,
      color: "#FFFFFF",
      textShadowColor: "rgba(0, 0, 0, 0.75)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    tabsContainer: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.xl,
      alignItems: "center",
      backgroundColor: colors.background,
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.text,
    },
    tabTextActive: {
      color: "#FFFFFF",
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
    },
    placeholderText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
    },
    tabContent: {
      flex: 1,
    },
    flatListPadding: {
      paddingHorizontal: Spacing.md,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
  });

  if (!pet) {
    return <Loading message="Cargando información..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mascotas</Text>
        <TouchableOpacity style={styles.cartButton}>
          <Icon name="cart" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {/* Banner with pet photo */}
      <View style={styles.bannerContainer}>
        {pet.photo_url ? (
          <ImageBackground
            source={{ uri: pet.photo_url }}
            style={styles.bannerImage}
            resizeMode="cover"
          >
            <View style={styles.bannerGradient}>
              <View style={styles.genderBadge}>
                <Text style={styles.genderIcon}>
                  {pet.sex === "male" ? (
                    <Icon name="male" size={22} color="#FFFFFF" />
                  ) : (
                    <Icon name="female" size={22} color="#FFFFFF" />
                  )}
                </Text>
              </View>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petInfo}>
                {translateBreed(pet.breed)} • {calculateAge(pet.birth_date)} •{" "}
                {pet.weight_kg}kg
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <ImageBackground
            source={require("@assets/images/profile/profile-pet.png")}
            style={styles.bannerImage}
            resizeMode="cover"
          >
            <View style={styles.bannerGradient}>
              <View style={styles.genderBadge}>
                <Text style={styles.genderIcon}>
                  {pet.sex === "male" ? (
                    <Icon name="male" size={22} color="#FFFFFF" />
                  ) : (
                    <Icon name="female" size={22} color="#FFFFFF" />
                  )}
                </Text>
              </View>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petInfo}>
                {translateBreed(pet.breed)} • {calculateAge(pet.birth_date)} •{" "}
                {pet.weight_kg}kg
              </Text>
            </View>
          </ImageBackground>
        )}

        {/* Edit button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => !isUploading && setImagePickerVisible(true)}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="pencil" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "grooming" && styles.tabActive]}
          onPress={() => setActiveTab("grooming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "grooming" && styles.tabTextActive,
            ]}
          >
            Grooming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "salud" && styles.tabActive]}
          onPress={() => setActiveTab("salud")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "salud" && styles.tabTextActive,
            ]}
          >
            Salud
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "historial" && styles.tabActive]}
          onPress={() => setActiveTab("historial")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "historial" && styles.tabTextActive,
            ]}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido de tabs */}
      <View style={styles.container}>
        {recordsLoading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator color={colors.primary} size="large" />
            <Text
              style={{
                color: colors.textSecondary,
                marginTop: Spacing.sm,
                fontFamily: Typography.fontFamily.regular,
                fontSize: Typography.fontSize.sm,
              }}
            >
              Cargando registros...
            </Text>
          </View>
        ) : (
          <>
            {activeTab === "grooming" && (
              <FlatList
                data={records.filter((r) => GROOMING_TYPES.includes(r.type))}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PetRecordCard record={item} />}
                contentContainerStyle={[
                  styles.flatListPadding,
                  { paddingBottom: 100 },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <EmptyTab
                    emoji="✂️"
                    title="Sin registros de grooming"
                    subtitle="Los baños y peluquerías aparecerán aquí"
                  />
                }
              />
            )}
            {activeTab === "salud" && (
              <FlatList
                data={records.filter((r) => HEALTH_TYPES.includes(r.type))}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PetRecordCard record={item} />}
                contentContainerStyle={[
                  styles.flatListPadding,
                  { paddingBottom: 100 },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <EmptyTab
                    emoji="🩺"
                    title="Sin registros de salud"
                    subtitle="Vacunas, consultas y medicamentos aparecerán aquí"
                  />
                }
              />
            )}
            {activeTab === "historial" && (
              <FlatList
                data={records}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PetRecordCard record={item} />}
                contentContainerStyle={[
                  styles.flatListPadding,
                  { paddingBottom: 100 },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <EmptyTab
                    emoji="📋"
                    title="Sin registros aún"
                    subtitle="Todos los registros de tu mascota aparecerán aquí"
                  />
                }
              />
            )}
          </>
        )}
      </View>

      {/* FAB — Agregar registro */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() =>
          router.push({
            pathname: "/(screens)/add-pet-record",
            params: { petId },
          })
        }
        activeOpacity={0.85}
      >
        <Icon name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

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
