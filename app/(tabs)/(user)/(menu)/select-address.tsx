import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAddressStore } from "@/store/addressStore";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useBookingStore } from "@/store/bookingStore";
import { ScreenHeader } from "@/components/common/ScreenHeader";

interface AddressCardProps {
  id: string;
  address: string;
  isDefault: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isDefault,
  isSelected,
  onSelect,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: isSelected ? colors.primary : colors.border,
      ...Shadows.sm,
    },
    cardContent: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isSelected ? colors.primary : colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    textContainer: {
      flex: 1,
    },
    addressText: {
      fontSize: Typography.fontSize.sm,
      // fontFamily: Typography.fontFamily.regular,
      color: colors.text,
      marginBottom: Spacing.xs,
      includeFontPadding: false,
    },
    defaultBadge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      alignSelf: "flex-start",
    },
    defaultText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onSelect}>
      <View style={styles.cardContent}>
        <View style={styles.radioOuter}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
        <View style={styles.textContainer}>
          <Text variant="medium" style={styles.addressText}>
            {address}
          </Text>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Predeterminada</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function SelectAddressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addresses, isLoading, fetchAddresses } = useAddressStore();
  const { setAddress } = useBookingStore();

  const [selectedAddressId, setSelectedAddressId] = React.useState<string>("");
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  // Seleccionar automáticamente la dirección por defecto
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else {
        setSelectedAddressId(addresses[0].id);
      }
    }
  }, [addresses]);

  const loadAddresses = async () => {
    await fetchAddresses();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  const handleAddNewAddress = () => {
    router.push("/(tabs)/(user)/add-address-for-service");
  };

  const handleContinue = () => {
    if (!selectedAddressId) return;

    // TODO: Navegar a la siguiente pantalla con el serviceCode y addressId

    setAddress(selectedAddressId!);
    router.push("/(tabs)/(user)/select-date");
    // router.push({ pathname: '/(tabs)/(user)/additional-service', params: { ... } });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    scrollContent: {
      padding: Spacing.md,
      paddingBottom: 180,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.md,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: Spacing.xl,
    },
    emptyText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.md,
    },
    fixedButtonsContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: Spacing.lg,
      paddingBottom: Spacing.xl,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 10,
    },
    addAddressButton: {
      backgroundColor: colors.primary,
      // borderWidth: 1,
      marginBottom: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    addAddressButtonText: {
      color: colors.surface,
      fontSize: Typography.fontSize.md,
    },
    addReservaBtn: {
      borderWidth: 1,
      borderColor: colors.secondary,
      backgroundColor: colors.secondary + "25",
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.sm,
      gap: Spacing.xs,
    },
    addReservaText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}

      <ScreenHeader
        title="Seleccione su dirección"
        backHref="/(tabs)/(user)/service-selected"
        right={{
          type: "icon",
          name: "cart",
          onPress: () => router.push("/(tabs)/(user)/cart"),
        }}
      />

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        <Text style={styles.sectionTitle}>¿Dónde realizamos el servicio?</Text>

        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="gps" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              No tienes direcciones guardadas.{"\n"}
              Agrega una dirección para continuar.
            </Text>
          </View>
        ) : (
          addresses.map((address) => (
            <AddressCard
              key={address.id}
              id={address.id}
              address={`${address.address_line} ${address.building_number}${
                address.apartment_number ? `, ${address.apartment_number}` : ""
              }`}
              isDefault={address.is_default}
              isSelected={selectedAddressId === address.id}
              onSelect={() => setSelectedAddressId(address.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Fixed Buttons */}
      <View style={styles.fixedButtonsContainer}>
        {/* <Button
          title="+ Agregar nueva dirección"
          onPress={handleAddNewAddress}
          fullWidth
          style={styles.addAddressButton}
          textStyle={styles.addAddressButtonText}
        /> */}

        {/* <TouchableOpacity
          style={styles.addAddressButton}
          onPress={handleAddNewAddress}
        >
          <Icon name="plus" size={18} color={colors.surface} />
          <Text variant="medium" style={styles.addAddressButtonText}>
            Registrar dirección
          </Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.addReservaBtn}
          onPress={handleAddNewAddress}
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <Text style={styles.addReservaText}>Registrar dirección</Text>
        </TouchableOpacity>
        <Button
          title="Continuar"
          onPress={handleContinue}
          fullWidth
          disabled={!selectedAddressId}
        />
      </View>
    </SafeAreaView>
  );
}
