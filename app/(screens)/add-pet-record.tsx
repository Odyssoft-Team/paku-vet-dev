/**
 * add-pet-record.tsx
 *
 * Pantalla para agregar un nuevo registro de mascota.
 * El formulario es dinámico — los campos cambian según el tipo seleccionado.
 *
 * Flujo:
 * 1. Usuario selecciona el tipo de registro
 * 2. Se renderizan los campos requeridos (y opcionales) para ese tipo
 * 3. Al guardar → POST /pets/{pet_id}/records
 * 4. Al éxito → vuelve al pet-detail con refresh
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { DatePicker } from "@/components/common/DatePicker";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { petRecordsService } from "@/api/services/pet-records.service";
import {
  RecordType,
  RECORD_TYPE_LABEL,
  RECORD_TYPE_EMOJI,
  REQUIRED_FIELDS,
  FIELD_LABELS,
  NUMERIC_FIELDS,
  DATE_FIELDS,
  MULTILINE_FIELDS,
} from "@/types/pet-record.types";

// ─── Tipos disponibles para el selector ───────────────────────────────────────
// Excluimos weight_record porque tiene su propio acceso rápido en el perfil

const ALL_TYPES: RecordType[] = [
  "vaccine",
  "check_up",
  "deworming",
  "medication",
  "grooming",
  "bath",
  "disease_condition",
  "surgery",
  "study_test",
  "nutrition",
  "weight_record",
  "note",
];

// Campos opcionales por tipo (para mostrar debajo de los requeridos)
const OPTIONAL_FIELDS: Record<RecordType, string[]> = {
  check_up: ["notes", "next_appointment"],
  vaccine: ["batch_number", "vet_name", "notes"],
  deworming: ["dose_mg", "method", "notes"],
  medication: ["reason", "vet_name", "notes"],
  bath: ["shampoo_used", "notes"],
  grooming: ["duration_minutes", "notes"],
  weight_record: [],
  nutrition: ["daily_grams", "meals_per_day", "notes"],
  disease_condition: ["diagnosed_by", "notes"],
  surgery: ["clinic_name", "anesthesia_type", "recovery_notes"],
  study_test: ["lab_name", "result_file_url"],
  note: [],
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function AddPetRecordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ petId: string }>();
  const petId = params.petId;

  const [step, setStep] = useState<"type" | "form">("type");
  const [selectedType, setSelectedType] = useState<RecordType | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showOptional, setShowOptional] = useState(false);
  const [dateValues, setDateValues] = useState<Record<string, Date | null>>({});
  const [saving, setSaving] = useState(false);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleTypeSelect = (type: RecordType) => {
    setSelectedType(type);
    setFieldValues({});
    setShowOptional(false);
    setStep("form");
  };

  const handleFieldChange = (field: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedType || !petId) return;

    // Validar campos requeridos
    const required = REQUIRED_FIELDS[selectedType];
    const missing = required.filter((f) => {
      if (DATE_FIELDS.has(f)) return !dateValues[f];
      return !fieldValues[f]?.trim();
    });
    if (missing.length > 0) {
      const missingLabels = missing.map((f) => FIELD_LABELS[f] ?? f).join(", ");
      Alert.alert("Campos incompletos", `Completa: ${missingLabels}`);
      return;
    }

    // Construir el objeto data — convertir numéricos
    const data: Record<string, any> = {};
    const allFields = [
      ...REQUIRED_FIELDS[selectedType],
      ...OPTIONAL_FIELDS[selectedType],
    ];
    for (const field of allFields) {
      if (DATE_FIELDS.has(field)) {
        const d = dateValues[field];
        if (d) data[field] = d.toISOString().split("T")[0]; // YYYY-MM-DD
        continue;
      }
      const val = fieldValues[field]?.trim();
      if (!val) continue;
      if (NUMERIC_FIELDS.has(field)) {
        data[field] = Number(val);
      } else {
        data[field] = val;
      }
    }

    setSaving(true);
    try {
      console.log("[AddRecord] Creando registro:", selectedType, data);
      await petRecordsService.create(petId, {
        type: selectedType,
        occurred_at: new Date().toISOString(),
        data,
      });
      console.log("[AddRecord] Registro creado OK");
      router.push({
        pathname: "/(tabs)/(user)/(menu)/pet-detail",
        params: { petId },
      });
    } catch (e: any) {
      console.error("[AddRecord] Error:", e?.message);
      const detail =
        e?.response?.data?.detail ??
        e?.message ??
        "No se pudo guardar el registro.";
      Alert.alert("Error al guardar", String(detail));
    } finally {
      setSaving(false);
    }
  };

  // ─── Estilos dinámicos ───────────────────────────────────────────────────────

  const inputStyle = {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: colors.text,
  };

  const labelStyle = {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
  };

  // ─── Render: selector de tipo ────────────────────────────────────────────────

  if (step === "type") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "bottom"]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <Icon name="close" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Tipo de registro
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            Selecciona qué quieres registrar
          </Text>

          <View style={styles.typeGrid}>
            {ALL_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleTypeSelect(type)}
                activeOpacity={0.75}
              >
                <Text style={styles.typeEmoji}>{RECORD_TYPE_EMOJI[type]}</Text>
                <Text
                  style={[styles.typeCardLabel, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {RECORD_TYPE_LABEL[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render: formulario dinámico ─────────────────────────────────────────────

  const requiredFields = REQUIRED_FIELDS[selectedType!];
  const optionalFields = OPTIONAL_FIELDS[selectedType!];

  const renderField = (field: string, isRequired: boolean) => {
    const isMultiline = MULTILINE_FIELDS.has(field);
    const isNumeric = NUMERIC_FIELDS.has(field);
    const isDate = DATE_FIELDS.has(field);
    const label = FIELD_LABELS[field] ?? field;

    // Campos de fecha → componente DatePicker nativo
    if (isDate) {
      return (
        <View key={field} style={{ marginBottom: Spacing.md }}>
          <Text style={labelStyle}>
            {label}
            {isRequired && (
              <Text style={{ color: colors.error ?? "#EF4444" }}> *</Text>
            )}
          </Text>
          <DatePicker
            value={dateValues[field] ?? null}
            onChange={(date) =>
              setDateValues((prev) => ({ ...prev, [field]: date }))
            }
            placeholder="Selecciona una fecha"
          />
        </View>
      );
    }

    return (
      <View key={field} style={{ marginBottom: Spacing.md }}>
        <Text style={labelStyle}>
          {label}
          {isRequired && (
            <Text style={{ color: colors.error ?? "#EF4444" }}> *</Text>
          )}
        </Text>
        <TextInput
          style={[
            inputStyle,
            isMultiline && { height: 80, textAlignVertical: "top" },
          ]}
          value={fieldValues[field] ?? ""}
          onChangeText={(v) => handleFieldChange(field, v)}
          placeholder={isNumeric ? "0" : `Ingresa ${label.toLowerCase()}`}
          placeholderTextColor={colors.textSecondary + "80"}
          keyboardType={isNumeric ? "decimal-pad" : "default"}
          multiline={isMultiline}
          numberOfLines={isMultiline ? 3 : 1}
          autoCapitalize={isMultiline ? "sentences" : "words"}
        />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setStep("type")}
          style={styles.headerBtn}
        >
          <Icon name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {RECORD_TYPE_EMOJI[selectedType!]} {RECORD_TYPE_LABEL[selectedType!]}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Campos requeridos */}
          <View
            style={[styles.formSection, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.formSectionTitle, { color: colors.text }]}>
              Información requerida
            </Text>
            {requiredFields.map((f) => renderField(f, true))}
          </View>

          {/* Campos opcionales */}
          {optionalFields.length > 0 && (
            <View
              style={[styles.formSection, { backgroundColor: colors.surface }]}
            >
              <TouchableOpacity
                style={styles.optionalToggle}
                onPress={() => setShowOptional((v) => !v)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.formSectionTitle,
                    { color: colors.text, marginBottom: 0 },
                  ]}
                >
                  Información adicional
                </Text>
                <Icon
                  name={showOptional ? "arrow-up" : "arrow-down"}
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {showOptional &&
                optionalFields.map((f) => (
                  <View key={f} style={{ marginTop: Spacing.md }}>
                    {renderField(f, false)}
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer fijo */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Button
          title={saving ? "Guardando..." : "Guardar registro"}
          onPress={handleSave}
          fullWidth
          loading={saving}
          disabled={saving}
          style={{ borderRadius: BorderRadius.full }}
        />
      </View>

      {/* Overlay saving */}
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color="#FFF" size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semibold,
    flex: 1,
    textAlign: "center",
  },
  sectionHint: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  typeCard: {
    width: "30%",
    flexGrow: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  typeEmoji: {
    fontSize: 28,
  },
  typeCardLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: "center",
    lineHeight: 16,
  },
  formSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  formSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
  },
  optionalToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
    paddingBottom: 24,
  },
  savingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
