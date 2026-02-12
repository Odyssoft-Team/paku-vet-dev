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
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Puedes buscar tu dirección manualmente o tocar en el mapa",
        );
        setLocation({
          latitude: defaultLocation.latitude,
          longitude: defaultLocation.longitude,
          address: "Lima, Perú",
        });
        setLoading(false);
        return;
      }

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
    } catch (error) {
      console.log("Error getting location:", error);
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

      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const address = result[0];
        return `${address.street || ""} ${address.streetNumber || ""}, ${
          address.city || address.region || ""
        }, ${address.country || ""}`;
      }

      return "Dirección no disponible";
    } catch (error) {
      console.log("Error getting address:", error);
      return "Dirección no disponible";
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
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const address = await getAddressFromCoordinates(latitude, longitude);

    setLocation({
      latitude,
      longitude,
      address,
    });
  };

  const handleMarkerDragEnd = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const address = await getAddressFromCoordinates(latitude, longitude);

    setLocation({
      latitude,
      longitude,
      address,
    });
  };

  const handleSaveLocation = () => {
    if (!location) {
      Alert.alert("Error", "Por favor selecciona una ubicación en el mapa");
      return;
    }

    // Guardar en el store
    setLocationData(location.latitude, location.longitude, location.address);

    console.log("Location saved:", location);

    // Volver atrás
    router.back();
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
