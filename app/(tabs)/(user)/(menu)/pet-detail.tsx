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
import CardHistory from "@/components/pets/CardHistory";
import type { ClinicalHistory } from "@/types/clinical-history.type";
import { clinicalHistoryService } from "@/api/services/clinical-history.service";
import CardHealth from "@/components/pets/CardHealth";
import { translateBreed } from "@/constants/breed";

// ─── Mock: historial de grooming por mascota ──────────────────────────────────
// TODO: reemplazar por endpoint real cuando esté disponible

export type GroomingServiceType =
  | "Baño clásico"
  | "Baño y corte"
  | "Deslanado"
  | "Spa completo";

export interface GroomingRecord {
  id: string;
  service: GroomingServiceType;
  date: string; // ISO
  groomer: string;
  address: string;
  total: number; // en centavos
  currency: string;
  status: "done" | "cancelled";
  duration_min: number;
  weight_kg: number;
  observations: string;
  products_used: string[];
  next_recommended: string; // ISO
}

const MOCK_GROOMING_HISTORY: GroomingRecord[] = [
  {
    id: "gr-001",
    service: "Baño y corte",
    date: "2026-03-24T10:00:00Z",
    groomer: "Maria López",
    address: "Av. La Molina 456",
    total: 8500,
    currency: "PEN",
    status: "done",
    duration_min: 90,
    weight_kg: 8.2,
    observations:
      "Mascota tranquila durante el servicio. Pelaje en buen estado.",
    products_used: [
      "Shampoo hipoalergénico",
      "Acondicionador nutritivo",
      "Perfume suave",
    ],
    next_recommended: "2026-04-21T10:00:00Z",
  },
  {
    id: "gr-002",
    service: "Baño clásico",
    date: "2026-02-10T14:30:00Z",
    groomer: "Carlos Ríos",
    address: "Av. La Molina 456",
    total: 6000,
    currency: "PEN",
    status: "done",
    duration_min: 60,
    weight_kg: 8.0,
    observations:
      "Se detectó leve irritación en la piel. Se recomienda shampoo hipoalergénico.",
    products_used: ["Shampoo hipoalergénico", "Crema hidratante"],
    next_recommended: "2026-03-10T14:30:00Z",
  },
  {
    id: "gr-003",
    service: "Spa completo",
    date: "2026-01-05T11:00:00Z",
    groomer: "Ana Torres",
    address: "Av. La Molina 456",
    total: 12000,
    currency: "PEN",
    status: "done",
    duration_min: 120,
    weight_kg: 7.9,
    observations:
      "Servicio completado sin novedades. Uñas cortadas y orejas limpias.",
    products_used: [
      "Shampoo premium",
      "Mascarilla capilar",
      "Perfume premium",
      "Limpiador de orejas",
    ],
    next_recommended: "2026-02-05T11:00:00Z",
  },
  {
    id: "gr-004",
    service: "Deslanado",
    date: "2025-12-15T09:00:00Z",
    groomer: "Maria López",
    address: "Av. La Molina 456",
    total: 9000,
    currency: "PEN",
    status: "cancelled",
    duration_min: 0,
    weight_kg: 7.8,
    observations: "Servicio cancelado por el cliente.",
    products_used: [],
    next_recommended: "2026-01-15T09:00:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGroomingDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

// ─── GroomingCard ─────────────────────────────────────────────────────────────

function GroomingCard({
  record,
  onPress,
}: {
  record: GroomingRecord;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const isDone = record.status === "done";

  return (
    <TouchableOpacity
      style={[groomStyles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Header: badge de estado + precio */}
      <View style={groomStyles.cardHeader}>
        <View
          style={[
            groomStyles.statusBadge,
            { backgroundColor: isDone ? "#D1FAE5" : "#F3F4F6" },
          ]}
        >
          <Text
            style={[
              groomStyles.statusText,
              { color: isDone ? "#10B981" : "#6B7280" },
            ]}
          >
            {isDone ? "Completado" : "Cancelado"}
          </Text>
        </View>
        <Text style={[groomStyles.price, { color: colors.primary }]}>
          {formatPrice(record.total, record.currency)}
        </Text>
      </View>

      {/* Nombre del servicio + flecha */}
      <View style={groomStyles.serviceRow}>
        <Text style={[groomStyles.serviceName, { color: colors.text }]}>
          {record.service}
        </Text>
        <Icon name="arrow-right" size={14} color={colors.textSecondary} />
      </View>

      {/* Fecha */}
      <View style={groomStyles.infoRow}>
        <Icon name="calendar" size={13} color={colors.textSecondary} />
        <Text style={[groomStyles.infoText, { color: colors.textSecondary }]}>
          {formatGroomingDate(record.date)}
        </Text>
      </View>

      {/* Groomer */}
      <View style={groomStyles.infoRow}>
        <Icon name="profile" size={13} color={colors.textSecondary} />
        <Text style={[groomStyles.infoText, { color: colors.textSecondary }]}>
          {record.groomer}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const groomStyles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  price: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semibold,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    maxWidth: 220,
    lineHeight: 20,
  },
});

type TabType = "salud" | "historial" | "citas";

export default function PetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { pets, updatePetPhoto } = usePetStore();
  const { uploadPhoto, isUploading } = useUploadPhoto();

  const [pet, setPet] = useState<Pet | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("salud");
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const [historyData, setHistoryData] = useState<ClinicalHistory[]>([]);

  const petId = params.petId as string;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await clinicalHistoryService.getHistoryByPet(petId); // Llamada al servicio
        setHistoryData(data); // Guardamos la data
      } catch (error) {
        console.error("Error al cargar historial:", error);
      }
    };

    fetchHistory();
  }, []);

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
          style={[styles.tab, activeTab === "citas" && styles.tabActive]}
          onPress={() => setActiveTab("citas")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "citas" && styles.tabTextActive,
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

      {/* /* --- Estructura Corregida ---  */}
      <View style={styles.container}>
        {activeTab === "citas" && (
          <FlatList
            data={historyData.filter((item) => item.type === "grooming")}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CardHistory history={item} petId={petId} />
            )}
            contentContainerStyle={styles.flatListPadding}
            showsVerticalScrollIndicator={false}
          />
        )}
        {activeTab === "salud" && (
          <FlatList
            data={historyData.filter((item) => item.type === "vaccine")}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CardHealth appointment={item} petId={petId} />
            )}
            contentContainerStyle={styles.flatListPadding}
            showsVerticalScrollIndicator={false}
          />
        )}

        {activeTab === "historial" && (
          <FlatList
            data={MOCK_GROOMING_HISTORY}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.flatListPadding,
              { paddingBottom: Spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={groomStyles.emptyContainer}>
                <Icon name="calendar" size={40} color={colors.textSecondary} />
                <Text style={[groomStyles.emptyTitle, { color: colors.text }]}>
                  Sin historial aún
                </Text>
                <Text
                  style={[
                    groomStyles.emptySubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  El historial de servicios de grooming aparecerá aquí
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <GroomingCard
                record={item}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/(user)/(menu)/grooming-detail",
                    params: { data: JSON.stringify(item) },
                  })
                }
              />
            )}
          />
        )}
      </View>

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
