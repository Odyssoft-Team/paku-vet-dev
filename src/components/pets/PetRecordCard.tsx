/**
 * PetRecordCard.tsx
 *
 * Card unificada para mostrar cualquier tipo de PetRecord.
 * Reemplaza CardHistory y CardHealth (ambos obsoletos).
 *
 * Muestra:
 * - Emoji + tipo de registro
 * - Título autogenerado por el backend
 * - Fecha del evento (occurred_at)
 * - Campos clave del data según el tipo
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/common/Text";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RECORD_TYPE_LABEL, RECORD_TYPE_EMOJI } from "@/types/pet-record.types";
import type { PetRecordOut } from "@/types/pet-record.types";

interface Props {
  record: PetRecordOut;
  onPress?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Extrae los campos más relevantes del data según el tipo
 * para mostrar como preview en la card.
 */
function getPreviewLines(
  record: PetRecordOut,
): { label: string; value: string }[] {
  const d = record.data ?? {};
  switch (record.type) {
    case "vaccine":
      return [
        { label: "Vacuna", value: d.vaccine_name ?? "—" },
        ...(d.next_dose_date
          ? [{ label: "Próxima dosis", value: formatDate(d.next_dose_date) }]
          : []),
        ...(d.vet_name ? [{ label: "Veterinario", value: d.vet_name }] : []),
      ];
    case "check_up":
      return [
        { label: "Veterinario", value: d.vet_name ?? "—" },
        { label: "Diagnóstico", value: d.diagnosis ?? "—" },
        ...(d.next_appointment
          ? [{ label: "Próxima cita", value: formatDate(d.next_appointment) }]
          : []),
      ];
    case "deworming":
      return [
        { label: "Producto", value: d.product_name ?? "—" },
        ...(d.next_due_date
          ? [
              {
                label: "Próxima aplicación",
                value: formatDate(d.next_due_date),
              },
            ]
          : []),
        ...(d.method ? [{ label: "Método", value: d.method }] : []),
      ];
    case "medication":
      return [
        { label: "Medicamento", value: d.drug_name ?? "—" },
        { label: "Dosis", value: `${d.dose ?? "—"} — ${d.frequency ?? "—"}` },
        {
          label: "Duración",
          value: d.duration_days ? `${d.duration_days} días` : "—",
        },
      ];
    case "bath":
      return [
        { label: "Realizado por", value: d.performed_by ?? "—" },
        ...(d.shampoo_used
          ? [{ label: "Shampoo", value: d.shampoo_used }]
          : []),
        ...(d.notes ? [{ label: "Notas", value: d.notes }] : []),
      ];
    case "grooming":
      return [
        { label: "Servicio", value: d.service_type ?? "—" },
        { label: "Realizado por", value: d.performed_by ?? "—" },
        ...(d.duration_minutes
          ? [{ label: "Duración", value: `${d.duration_minutes} min` }]
          : []),
      ];
    case "weight_record":
      return [
        {
          label: "Peso registrado",
          value: d.weight_kg ? `${d.weight_kg} kg` : "—",
        },
      ];
    case "nutrition":
      return [
        { label: "Alimento", value: d.food_brand ?? "—" },
        { label: "Tipo", value: d.food_type ?? "—" },
        ...(d.daily_grams
          ? [{ label: "Gramos diarios", value: `${d.daily_grams} g` }]
          : []),
      ];
    case "disease_condition":
      return [
        { label: "Condición", value: d.condition_name ?? "—" },
        { label: "Estado", value: d.status ?? "—" },
        ...(d.diagnosed_by
          ? [{ label: "Diagnosticado por", value: d.diagnosed_by }]
          : []),
      ];
    case "surgery":
      return [
        { label: "Procedimiento", value: d.procedure_name ?? "—" },
        { label: "Veterinario", value: d.vet_name ?? "—" },
        ...(d.clinic_name ? [{ label: "Clínica", value: d.clinic_name }] : []),
      ];
    case "study_test":
      return [
        { label: "Estudio", value: d.test_name ?? "—" },
        { label: "Resultado", value: d.result_summary ?? "—" },
        ...(d.lab_name ? [{ label: "Laboratorio", value: d.lab_name }] : []),
      ];
    case "note":
      return [{ label: "Nota", value: d.text ?? "—" }];
    default:
      return [];
  }
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function PetRecordCard({ record, onPress }: Props) {
  const { colors } = useTheme();

  const emoji = RECORD_TYPE_EMOJI[record.type] ?? "📋";
  const label = RECORD_TYPE_LABEL[record.type] ?? record.type;
  const previewLines = getPreviewLines(record);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Header: emoji + tipo + fecha */}
      <View style={styles.header}>
        <View
          style={[
            styles.emojiContainer,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.typeLabel, { color: colors.primary }]}>
            {label}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(record.occurred_at)}
          </Text>
        </View>
      </View>

      {/* Título autogenerado por el backend */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {record.title}
      </Text>

      {/* Preview de campos clave */}
      {previewLines.length > 0 && (
        <View style={styles.previewContainer}>
          {previewLines.slice(0, 3).map((line, i) => (
            <View key={i} style={styles.previewRow}>
              <Text
                style={[styles.previewLabel, { color: colors.textSecondary }]}
              >
                {line.label}:
              </Text>
              <Text
                style={[styles.previewValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {line.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Registrado por */}
      {record.recorded_by_role && (
        <Text style={[styles.recordedBy, { color: colors.textSecondary }]}>
          Registrado por:{" "}
          {record.recorded_by_role === "owner"
            ? "dueño"
            : record.recorded_by_role}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 20,
  },
  typeLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  date: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 1,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    lineHeight: 20,
  },
  previewContainer: {
    marginTop: 4,
    gap: 3,
  },
  previewRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  previewLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  previewValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    flex: 1,
  },
  recordedBy: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 4,
    opacity: 0.6,
  },
});
