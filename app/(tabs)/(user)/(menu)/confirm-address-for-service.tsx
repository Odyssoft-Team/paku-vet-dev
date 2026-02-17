import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useAddressStore } from "@/store/addressStore";
import { useAddAddressStore } from "@/store/addAddressStore";
import { useGeoStore } from "@/store/geoStore";
import { CreateAddressData } from "@/types/address.types";
import { getDistrictCoordinates } from "@/constants/districtCoordinates";

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export default function ConfirmAddressForServiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);

  // Stores
  const { createAddress } = useAddressStore();
  const formData = useAddAddressStore();
  const { districts } = useGeoStore();

  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultLocation = {
    latitude: -12.0464,
    longitude: -77.0428,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = () => {
    try {
      if (!formData.district_id) {
        console.log("No hay distrito seleccionado");
        useDefaultLocation();
        setLoading(false);
        return;
      }

      const selectedDistrict = districts.find(
        (d) => d.id === formData.district_id,
      );
      console.log("Distrito seleccionado:", selectedDistrict);

      const coords = getDistrictCoordinates(formData.district_id);

      if (coords) {
        console.log("Coordenadas del distrito:", coords);

        const address = `${formData.address_line} ${formData.building_number}${
          formData.apartment_number ? `, ${formData.apartment_number}` : ""
        }, ${selectedDistrict?.name || "Lima"}, Lima, Perú`;

        setLocation({
          latitude: coords.lat,
          longitude: coords.lng,
          address: address,
        });

        formData.setStep2Data(coords.lat, coords.lng);

        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: coords.lat,
              longitude: coords.lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            1000,
          );
        }, 500);
      } else {
        console.log("No se encontraron coordenadas para el distrito");
        useDefaultLocation();
      }
    } catch (error) {
      console.error("Error inicializando ubicación:", error);
      useDefaultLocation();
    } finally {
      setLoading(false);
    }
  };

  const useDefaultLocation = () => {
    const lat = defaultLocation.latitude;
    const lng = defaultLocation.longitude;

    console.log("Usando ubicación por defecto:", { lat, lng });

    setLocation({
      latitude: lat,
      longitude: lng,
      address: `${formData.address_line || ""} ${formData.building_number || ""}, Lima, Perú`,
    });

    formData.setStep2Data(lat, lng);
  };

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number,
  ): Promise<string> => {
    const selectedDistrict = districts.find(
      (d) => d.id === formData.district_id,
    );

    return `${formData.address_line} ${formData.building_number}${
      formData.apartment_number ? `, ${formData.apartment_number}` : ""
    }, ${selectedDistrict?.name || "Lima"}, Lima, Perú`;
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const address = await getAddressFromCoordinates(latitude, longitude);

    setLocation({ latitude, longitude, address });
    formData.setStep2Data(latitude, longitude);
  };

  const handleMarkerDragEnd = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const address = await getAddressFromCoordinates(latitude, longitude);

    setLocation({ latitude, longitude, address });
    formData.setStep2Data(latitude, longitude);
  };

  const handleSaveAddress = async () => {
    if (!location || !formData.lat || !formData.lng) {
      Alert.alert("Error", "Por favor selecciona una ubicación en el mapa");
      return;
    }

    try {
      setSaving(true);

      const addressData: CreateAddressData = {
        district_id: formData.district_id,
        address_line: formData.address_line,
        building_number: formData.building_number,
        apartment_number: formData.apartment_number || undefined,
        lat: formData.lat,
        lng: formData.lng,
        is_default: false,
      };

      console.log("Guardando dirección:", addressData);

      await createAddress(addressData);

      // Limpiar el formulario después de guardar
      formData.clearForm();

      Alert.alert("Éxito", "Dirección agregada correctamente", [
        {
          text: "OK",
          onPress: () => {
            // Regresar a la pantalla de selección de dirección
            router.push({
              pathname: "/(tabs)/(user)/select-address",
              params: { serviceCode: params.serviceCode },
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Error al guardar dirección:", error);
      Alert.alert("Error", "No se pudo guardar la dirección");
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    backButton: {
      padding: Spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
    },
    cancelButton: {
      padding: Spacing.sm,
    },
    cancelText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: "#FFFFFF",
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
    },
    infoHint: {
      position: "absolute",
      top: 10,
      left: Spacing.md,
      right: Spacing.md,
      backgroundColor: colors.surface,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      ...Shadows.md,
    },
    infoHintText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.primary,
      textAlign: "left",
    },
    addressCard: {
      position: "absolute",
      bottom: 120,
      left: Spacing.md,
      right: Spacing.md,
      backgroundColor: colors.surface,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      ...Shadows.lg,
    },
    addressText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      lineHeight: 20,
    },
    fixedButton: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.lg,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agregar dirección</Text>
          <View style={styles.cancelButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Preparando mapa...</Text>
        </View>
      </SafeAreaView>
    );
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
        <Text style={styles.headerTitle}>Confirmar ubicación</Text>
        <View style={styles.cancelButton} />
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location?.latitude || defaultLocation.latitude,
            longitude: location?.longitude || defaultLocation.longitude,
            latitudeDelta: defaultLocation.latitudeDelta,
            longitudeDelta: defaultLocation.longitudeDelta,
          }}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          mapType="none"
        >
          {isDark ? (
            <UrlTile
              urlTemplate="https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
          ) : (
            <UrlTile
              urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
          )}

          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              draggable
              onDragEnd={handleMarkerDragEnd}
              title="Tu dirección"
            />
          )}
        </MapView>

        {/* Hint */}
        <View style={styles.infoHint}>
          <Text style={styles.infoHintText}>
            Arrastra el marcador a la ubicación exacta de tu dirección.
          </Text>
        </View>

        {/* Tarjeta de dirección */}
        {location && (
          <View style={styles.addressCard}>
            <Text style={styles.addressText}>{location.address}</Text>
          </View>
        )}
      </View>

      {/* Botón Guardar */}
      <View style={styles.fixedButton}>
        <Button
          title="Guardar"
          onPress={handleSaveAddress}
          fullWidth
          disabled={!location}
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}
