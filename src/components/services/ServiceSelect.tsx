import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Text, Icon } from "@/components/common";
import { useTheme } from "@/hooks";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";

interface Option {
  id: string;
  label: string;
  price: number;
  description: string;
  longDescription?: string; // Descripción más detallada para la vista inferior
  image?: any; // Para require(@assets/...)
}

interface ServiceSelectProps {
  options: Option[];
  onSelect: (option: Option) => void;
  selectedId?: string;
}

export const ServiceSelect: React.FC<ServiceSelectProps> = ({
  options,
  onSelect,
  selectedId,
}) => {
  const { colors } = useTheme();
  // Iniciamos cerrado o abierto según tu preferencia
  const [isOpen, setIsOpen] = useState(false);

  // Encontramos el label de la opción seleccionada para mostrarlo en el header
  const selectedOption = options.find((opt) => opt.id === selectedId);

  const handleSelect = (option: Option) => {
    // Si el ID seleccionado es igual al que acabamos de presionar, desmarcamos
    if (selectedId === option.id) {
      // @ts-ignore - Dependiendo de tu tipado, podrías pasar null o un objeto vacío
      onSelect(null);
    } else {
      onSelect(option);
    }
    setIsOpen(false);
  };

  return (
    <View style={styles.mainWrapper}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            {selectedOption ? selectedOption.label : "Selecciona tu opción"}
          </Text>
          <Icon
            name={isOpen ? "arrow-up" : "arrow-down"}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.scrollContainer}>
            <ScrollView nestedScrollEnabled style={styles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionItem}
                  onPress={() => handleSelect(option)}
                >
                  <View
                    style={[
                      styles.radioButton,
                      {
                        borderColor:
                          selectedId === option.id
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    {selectedId === option.id && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>

                  {/* Imagen pequeña opcional en la lista */}
                  {option.image && (
                    <Image
                      source={option.image}
                      style={styles.smallThumbnail}
                    />
                  )}

                  <View style={styles.optionContent}>
                    <Text
                      style={[styles.optionLabel, { color: colors.primary }]}
                    >
                      {option.label} — S/{option.price}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      *{option.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* VISTA DETALLE INFERIOR (Solo si hay imagen) */}
      {selectedOption?.image && !isOpen && (
        <View style={styles.detailContainer}>
          <Text style={styles.sectionLabel}>5. Foto-producto</Text>
          <View style={[styles.imageCard, { borderColor: colors.primary }]}>
            <Image
              source={selectedOption.image}
              style={styles.largeImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailTitle, { color: colors.primary }]}>
              {selectedOption.label} — S/{selectedOption.price}
            </Text>
            <Text style={[styles.detailLongDesc, { color: colors.primary }]}>
              *{selectedOption.longDescription || selectedOption.description}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: "#F9F9FF", // Color de fondo suave según imagen
  },
  headerTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  scrollContainer: {
    maxHeight: 220, // Ajusta este valor según cuántos items quieras mostrar (aprox 3 items)
  },
  optionsList: {
    paddingVertical: Spacing.xs,
  },
  optionItem: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: "flex-start",
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  optionDescription: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  mainWrapper: {
    width: "100%",
  },
  smallThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginLeft: 10,
  },
  detailContainer: {
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    color: "#666",
    marginBottom: Spacing.xs,
  },
  imageCard: {
    borderWidth: 2,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    height: 300,
  },
  largeImage: {
    width: "100%",
    height: "100%",
  },
  detailTextContainer: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  detailTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  detailLongDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
    marginTop: 4,
  },
});
