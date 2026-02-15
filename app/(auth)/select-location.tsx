import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MapView, { Marker, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useLocationStore } from "@/store/locationStore";

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export default function SelectLocationScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);

  // Obtener ubicación guardada del store
  const savedLocation = useLocationStore((state) => ({
    latitude: state.latitude,
    longitude: state.longitude,
    address: state.address,
  }));
  const setLocationData = useLocationStore((state) => state.setLocation);

  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualAddressInput, setManualAddressInput] = useState("");

  const defaultLocation = {
    latitude: -12.0464,
    longitude: -77.0428,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    // Si hay ubicación guardada, usarla
    if (
      savedLocation.latitude &&
      savedLocation.longitude &&
      savedLocation.address
    ) {
      setLocation({
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
        address: savedLocation.address,
      });

      // Centrar el mapa en la ubicación guardada
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: savedLocation.latitude as number,
            longitude: savedLocation.longitude as number,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000,
        );
      }, 500);

      setLoading(false);
    } else {
      // Si no hay ubicación guardada, obtener ubicación actual
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationError(null);
      
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        const errorMsg = "Permiso de ubicación denegado. Puedes ingresar la dirección manualmente o tocar en el mapa.";
        setLocationError(errorMsg);
        setLocation({
          latitude: defaultLocation.latitude,
          longitude: defaultLocation.longitude,
          address: "Lima, Perú",
        });
        setLoading(false);
        return;
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = currentLocation.coords;
        const address = await getAddressFromCoordinates(latitude, longitude);

        setLocation({
          latitude,
          longitude,
          address,
        });

        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000,
        );
      } catch (locationError: any) {
        const errorMsg = `No se pudo obtener tu ubicación actual: ${locationError?.message || 'Error desconocido'}. Puedes ingresar la dirección manualmente.`;
        console.log("Error getting current position:", locationError);
        setLocationError(errorMsg);
        
        // Fallback a ubicación por defecto
        setLocation({
          latitude: defaultLocation.latitude,
          longitude: defaultLocation.longitude,
          address: "Lima, Perú",
        });
      }
    } catch (error: any) {
      const errorMsg = `Error al solicitar permisos: ${error?.message || 'Error desconocido'}. Puedes ingresar la dirección manualmente.`;
      console.log("Error requesting permissions:", error);
      setLocationError(errorMsg);
      
      setLocation({
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
        address: "Lima, Perú",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number,
  ): Promise<string> => {
    try {
      setLoadingAddress(true);

      const result = await Promise.race([
        Location.reverseGeocodeAsync({
          latitude,
          longitude,
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout al obtener dirección')), 8000)
        )
      ]);

      if (result.length > 0) {
        const address = result[0];
        return `${address.street || ""} ${address.streetNumber || ""}, ${
          address.city || address.region || ""
        }, ${address.country || ""}`;
      }

      return "Dirección no disponible";
    } catch (error: any) {
      console.log("Error getting address:", error?.message || error);
      return "Dirección no disponible - Puedes ingresarla manualmente";
    } finally {
      setLoadingAddress(false);
    }
  };

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);

      // Delay para respetar rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ", Lima, Perú",
        )}&limit=5&addressdetails=1&accept-language=es`,
        {
          headers: {
            "User-Agent": "PakuVet/1.0",
          },
        },
      );

      const data = await response.json();
      setSearchResults(data || []);
    } catch (error) {
      console.log("Error searching:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = async (result: SearchResult) => {
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    setLocation({
      latitude,
      longitude,
      address: result.display_name,
    });

    setSearchQuery("");
    setSearchResults([]);
    Keyboard.dismiss();

    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000,
    );
  };

  const handleMapPress = async (event: any) => {
    try {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      const address = await getAddressFromCoordinates(latitude, longitude);

      setLocation({
        latitude,
        longitude,
        address,
      });
      setLocationError(null);
    } catch (error: any) {
      console.log("Error handling map press:", error);
      setLocationError(`Error al seleccionar ubicación: ${error?.message || 'Error desconocido'}`);
    }
  };

  const handleMarkerDragEnd = async (event: any) => {
    try {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      const address = await getAddressFromCoordinates(latitude, longitude);

      setLocation({
        latitude,
        longitude,
        address,
      });
      setLocationError(null);
    } catch (error: any) {
      console.log("Error handling marker drag:", error);
      setLocationError(`Error al mover marcador: ${error?.message || 'Error desconocido'}`);
    }
  };

  const handleSaveLocation = () => {
    // Permitir guardar dirección manual si el mapa falló
    if (!location && !manualAddressInput.trim()) {
      Alert.alert(
        "Dirección requerida",
        "Por favor selecciona una ubicación en el mapa o ingresa tu dirección manualmente"
      );
      return;
    }

    // Si hay dirección manual y no hay location del mapa, usar coordenadas por defecto
    if (manualAddressInput.trim() && (!location || location.address === "Lima, Perú")) {
      setLocationData(
        defaultLocation.latitude,
        defaultLocation.longitude,
        manualAddressInput.trim()
      );
      console.log("Manual address saved:", manualAddressInput);
      router.back();
      return;
    }

    if (location) {
      // Guardar en el store
      setLocationData(location.latitude, location.longitude, location.address);
      console.log("Location saved:", location);
      router.back();
    }
  };

  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      marginBottom: insets.bottom,
      marginLeft: insets.left,
      marginRight: insets.right,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    backButton: {
      padding: Spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: "#FFFFFF",
      textAlign: "center",
      marginRight: 40,
    },
    searchContainer: {
      position: "absolute",
      top: Spacing.md,
      left: Spacing.md,
      right: Spacing.md,
      zIndex: 1,
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      ...Shadows.lg,
    },
    searchInput: {
      flex: 1,
      paddingVertical: Spacing.md,
      fontSize: Typography.fontSize.md,
      color: colors.text,
    },
    searchIcon: {
      marginLeft: Spacing.sm,
    },
    searchResults: {
      marginTop: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      maxHeight: 250,
      ...Shadows.lg,
    },
    searchResultItem: {
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchResultText: {
      fontSize: Typography.fontSize.sm,
      color: colors.text,
      lineHeight: 20,
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
      color: colors.textSecondary,
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
    addressTitle: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.textSecondary,
    },
    addressText: {
      fontSize: Typography.fontSize.sm,
      color: colors.text,
      lineHeight: 20,
    },
    addressLoading: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    myLocationButton: {
      position: "absolute",
      right: Spacing.lg,
      bottom: 220,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      ...Shadows.md,
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
      color: colors.primary,
      textAlign: "left",
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.error + "20",
      padding: Spacing.md,
      gap: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.error,
    },
    errorBannerText: {
      flex: 1,
      fontSize: Typography.fontSize.sm,
      color: colors.error,
      lineHeight: 18,
    },
    manualInputContainer: {
      padding: Spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    manualInputLabel: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    manualInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      fontSize: Typography.fontSize.md,
      color: colors.text,
      backgroundColor: colors.background,
      minHeight: 60,
      textAlignVertical: "top",
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
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agregar dirección</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
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
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar dirección</Text>
      </View>

      {/* Banner de error */}
      {(locationError || mapError) && (
        <View style={styles.errorBanner}>
          <Icon name="close" size={20} color={colors.error} />
          <Text style={styles.errorBannerText}>
            {locationError || mapError}
          </Text>
        </View>
      )}

      {/* Input manual de dirección (fallback) */}
      {(locationError || mapError) && (
        <View style={styles.manualInputContainer}>
          <Text style={styles.manualInputLabel}>O ingresa tu dirección manualmente:</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="Ej: Av. Larco 123, Miraflores, Lima"
            placeholderTextColor={colors.placeholder}
            value={manualAddressInput}
            onChangeText={setManualAddressInput}
            multiline
            numberOfLines={2}
          />
        </View>
      )}

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
          {/* Usar tiles de CartoDB (más permisivo que OSM directo) */}
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
              title="Tu ubicación"
            />
          )}
        </MapView>

        {/* Hint inicial */}
        {!searchQuery && (
          <View style={styles.infoHint}>
            <Text style={styles.infoHintText}>
              Arrastra el marcador o toca en el mapa para ajustar tu ubicación
            </Text>
          </View>
        )}

        {/* Botón Mi Ubicación */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={getCurrentLocation}
        >
          <Icon name="gps" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Tarjeta de dirección */}
        {location && !searchResults.length && (
          <View style={styles.addressCard}>
            {loadingAddress ? (
              <View style={styles.addressLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.addressText}>Obteniendo dirección...</Text>
              </View>
            ) : (
              <Text style={styles.addressText}>{location.address}</Text>
            )}
          </View>
        )}
      </View>

      {/* Botón Guardar */}
      <View style={styles.fixedButton}>
        <Button
          title="Guardar"
          onPress={handleSaveLocation}
          fullWidth
          disabled={!location}
        />
      </View>
    </SafeAreaView>
  );
}
