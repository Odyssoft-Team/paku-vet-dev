import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useAvailabilityStore } from "@/store/availabilityStore";
import { useSpaServices } from "@/hooks/useSpaceServices";
import { useBookingStore } from "@/store/bookingStore";

const DAYS = ["L", "Ma", "Mi", "J", "V", "S", "D"];
const MONTHS = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

export default function SelectDateScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const { data: packages } = useSpaServices();
  const { serviceCode, setDate } = useBookingStore();

  const { availability, isLoading, fetchAvailability } = useAvailabilityStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Encontrar el servicio seleccionado desde el store
  const selectedService = packages?.find((pkg) => pkg.code === serviceCode);

  useEffect(() => {
    loadAvailability();
  }, [currentMonth]);

  const loadAvailability = async () => {
    // if (!selectedService?.id) return;

    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    const dateFrom = firstDay.toISOString().split("T")[0];

    // CORRECCIÓN: Limitar a máximo 30 días
    const daysInMonth = lastDay.getDate();
    const days = Math.min(daysInMonth, 30);

    await fetchAvailability({
      service_id: "11111111-1111-1111-1111-111111111111",
      date_from: dateFrom,
      days: days,
    });
  };

  // const loadAvailability = async () => {
  //   // if (!selectedService?.id) return;

  //   const firstDay = new Date(
  //     currentMonth.getFullYear(),
  //     currentMonth.getMonth(),
  //     1,
  //   );
  //   const lastDay = new Date(
  //     currentMonth.getFullYear(),
  //     currentMonth.getMonth() + 1,
  //     0,
  //   );

  //   const dateFrom = firstDay.toISOString().split("T")[0];
  //   const days = lastDay.getDate();

  //   await fetchAvailability({
  //     // service_id: selectedService.id,
  //     service_id: "11111111-1111-1111-1111-111111111111",
  //     date_from: dateFrom,
  //     days: days,
  //   });
  // };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysArray = [];
    const startingDayOfWeek =
      firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunes = 0

    // Días del mes anterior para llenar
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      daysArray.push({
        date: prevDate,
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      daysArray.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Días del siguiente mes para completar la grilla
    const remainingDays = 42 - daysArray.length; // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      daysArray.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return daysArray;
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return availability.find((a) => a.date === dateString);
  };

  const isDayOccupied = (date: Date) => {
    const avail = getAvailabilityForDate(date);
    return avail ? avail.available === 0 : false;
  };

  const isDayPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const handleDateSelect = (date: Date) => {
    if (!date) return;

    const dateString = date.toISOString().split("T")[0];

    // No permitir seleccionar fechas pasadas o ocupadas
    if (isDayPast(date) || isDayOccupied(date)) return;

    setSelectedDate(dateString);
  };

  const handleContinue = () => {
    if (!selectedDate) return;
    setDate(selectedDate);
    router.push("/(tabs)/(user)/cart");
  };

  const getSelectedDateAvailability = () => {
    if (!selectedDate) return null;
    return availability.find((a) => a.date === selectedDate);
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
      width: 40,
    },
    headerTitle: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: "#FFFFFF",
      textAlign: "center",
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
    },
    titleContainer: {
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    serviceTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    calendarContainer: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    monthHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.lg,
    },
    monthButton: {
      padding: Spacing.sm,
    },
    monthText: {
      fontSize: Typography.fontSize.md,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
    },
    daysHeader: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: Spacing.sm,
    },
    dayHeaderText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: colors.primary,
      width: 40,
      textAlign: "center",
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: "14.28%", // 100% / 7 días
      aspectRatio: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 2,
    },
    dayButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    dayButtonSelected: {
      backgroundColor: colors.primary,
    },
    dayButtonOccupied: {
      backgroundColor: colors.primary,
    },
    dayText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
    },
    dayTextSelected: {
      color: "#FFFFFF",
      fontFamily: Typography.fontFamily.bold,
    },
    dayTextOccupied: {
      color: "#FFFFFF",
    },
    dayTextPast: {
      color: colors.textSecondary,
    },
    dayTextOtherMonth: {
      color: colors.border,
    },
    legendContainer: {
      marginBottom: Spacing.md,
    },
    legendText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: colors.textSecondary,
    },
    availabilityInfo: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.xxl,
    },
    availabilityTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.bold,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    availabilityText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text,
    },
    loadingContainer: {
      padding: Spacing.xl,
      alignItems: "center",
    },
    fixedButton: {
      padding: Spacing.lg,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    dayButtonPast: {
      // backgroundColor: colors.border + "40", // Fondo gris claro para días pasados
      opacity: 0.3,
    },
    dayButtonDisabled: {
      opacity: 0.3,
      color: colors.text,
    },
  });

  if (isLoading && availability.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleccionar fecha</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: colors.textSecondary }}>
            Cargando disponibilidad...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = getDaysInMonth();
  const selectedAvailability = getSelectedDateAvailability();

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
        <Text style={styles.headerTitle}>Seleccionar fecha</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Selecciona tu fecha</Text>
          <Text style={styles.serviceTitle}>
            PAKU Spa - {selectedService?.name || "Clásico"}
          </Text>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          {/* Month Header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={handlePreviousMonth}
            >
              <Icon name="arrow-left" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={handleNextMonth}
            >
              <Icon name="arrow-right" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Days Header */}
          <View style={styles.daysHeader}>
            {DAYS.map((day) => (
              <Text key={day} style={styles.dayHeaderText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              const dateString = day.date.toISOString().split("T")[0];
              const isSelected = selectedDate === dateString;
              const isOccupied = isDayOccupied(day.date);
              const isPast = isDayPast(day.date);
              const isDisabled = !day.isCurrentMonth || isPast || isOccupied;

              return (
                <View key={index} style={styles.dayCell}>
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      isSelected && styles.dayButtonSelected,
                      isOccupied &&
                        day.isCurrentMonth &&
                        styles.dayButtonOccupied,
                      // CORRECCIÓN: Agregar estilo para días pasados
                      isPast && day.isCurrentMonth && styles.dayButtonPast,
                      isDisabled && styles.dayButtonDisabled,
                    ]}
                    onPress={() => handleDateSelect(day.date)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isOccupied &&
                          day.isCurrentMonth &&
                          styles.dayTextOccupied,
                        isPast && styles.dayTextPast,
                        !day.isCurrentMonth && styles.dayTextOtherMonth,
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendText}>
            *Las fechas sombreadas ya están ocupadas.
          </Text>
        </View>

        {/* Availability Info */}
        {selectedAvailability && (
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityTitle}>Cupos disponibles</Text>
            <Text style={styles.availabilityText}>
              Fecha -{" "}
              {/* CORRECCIÓN: Usar el string directamente y agregar 'Z' para UTC */}
              {new Date(selectedDate! + "T00:00:00").toLocaleDateString(
                "es-PE",
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                },
              )}{" "}
              • {selectedAvailability.available} cupos disponibles
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Button */}
      <View style={styles.fixedButton}>
        <Button
          title="Continuar"
          onPress={handleContinue}
          fullWidth
          disabled={!selectedDate}
        />
      </View>
    </SafeAreaView>
  );
}
