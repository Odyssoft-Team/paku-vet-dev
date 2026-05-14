/**
 * pet-record.types.ts
 *
 * Tipos del módulo pet_records — basado en la documentación del backend (Mayo 2026).
 * Reemplaza los tipos de ClinicalHistory que ya están obsoletos.
 */

// ─── Enum de tipos de registro ─────────────────────────────────────────────────

export type RecordType =
  | "check_up"
  | "vaccine"
  | "deworming"
  | "medication"
  | "bath"
  | "grooming"
  | "weight_record"
  | "nutrition"
  | "disease_condition"
  | "surgery"
  | "study_test"
  | "note";

// ─── Agrupación por tab ────────────────────────────────────────────────────────

export const GROOMING_TYPES: RecordType[] = ["grooming", "bath"];

export const HEALTH_TYPES: RecordType[] = [
  "vaccine",
  "check_up",
  "deworming",
  "medication",
  "surgery",
  "disease_condition",
  "study_test",
];

// ─── Labels y emojis para UI ───────────────────────────────────────────────────

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  check_up: "Consulta veterinaria",
  vaccine: "Vacuna",
  deworming: "Desparasitación",
  medication: "Medicamento",
  bath: "Baño",
  grooming: "Peluquería",
  weight_record: "Peso",
  nutrition: "Nutrición",
  disease_condition: "Enfermedad / Condición",
  surgery: "Cirugía",
  study_test: "Estudio / Análisis",
  note: "Nota",
};

export const RECORD_TYPE_EMOJI: Record<RecordType, string> = {
  check_up: "🩺",
  vaccine: "💉",
  deworming: "🐛",
  medication: "💊",
  bath: "🛁",
  grooming: "✂️",
  weight_record: "⚖️",
  nutrition: "🥣",
  disease_condition: "🤒",
  surgery: "🔪",
  study_test: "🧪",
  note: "📝",
};

// ─── Campos requeridos por tipo (para el formulario dinámico) ─────────────────

export const REQUIRED_FIELDS: Record<RecordType, string[]> = {
  check_up: ["vet_name", "diagnosis"],
  vaccine: ["vaccine_name", "next_dose_date"],
  deworming: ["product_name", "next_due_date"],
  medication: ["drug_name", "dose", "frequency", "duration_days"],
  bath: ["performed_by"],
  grooming: ["service_type", "performed_by"],
  weight_record: ["weight_kg"],
  nutrition: ["food_brand", "food_type"],
  disease_condition: ["condition_name", "status"],
  surgery: ["procedure_name", "vet_name"],
  study_test: ["test_name", "result_summary"],
  note: ["text"],
};

// Labels amigables para cada campo del formulario
export const FIELD_LABELS: Record<string, string> = {
  // check_up
  vet_name: "Nombre del veterinario",
  diagnosis: "Diagnóstico",
  next_appointment: "Próxima cita (fecha)",
  // vaccine
  vaccine_name: "Nombre de la vacuna",
  next_dose_date: "Fecha próxima dosis",
  batch_number: "Número de lote",
  // deworming
  product_name: "Nombre del producto",
  next_due_date: "Próxima aplicación",
  dose_mg: "Dosis (mg)",
  method: "Método",
  // medication
  drug_name: "Nombre del medicamento",
  dose: "Dosis",
  frequency: "Frecuencia",
  duration_days: "Duración (días)",
  reason: "Motivo",
  // bath / grooming
  performed_by: "Realizado por",
  shampoo_used: "Shampoo usado",
  service_type: "Tipo de servicio",
  duration_minutes: "Duración (minutos)",
  // weight_record
  weight_kg: "Peso (kg)",
  // nutrition
  food_brand: "Marca de alimento",
  food_type: "Tipo de alimento",
  daily_grams: "Gramos diarios",
  meals_per_day: "Comidas al día",
  // disease_condition
  condition_name: "Nombre de la condición",
  status: "Estado",
  diagnosed_by: "Diagnosticado por",
  // surgery
  procedure_name: "Nombre del procedimiento",
  clinic_name: "Clínica",
  anesthesia_type: "Tipo de anestesia",
  recovery_notes: "Notas de recuperación",
  // study_test
  test_name: "Nombre del estudio",
  result_summary: "Resumen del resultado",
  lab_name: "Laboratorio",
  result_file_url: "URL del resultado",
  // note
  text: "Nota",
  // shared
  notes: "Notas adicionales",
};

// Campos que son numéricos (para el teclado correcto)
export const NUMERIC_FIELDS = new Set([
  "weight_kg",
  "dose_mg",
  "duration_days",
  "duration_minutes",
  "daily_grams",
  "meals_per_day",
]);

// Campos que son fechas (para mostrar date picker)
export const DATE_FIELDS = new Set([
  "next_dose_date",
  "next_due_date",
  "next_appointment",
]);

// Campos de texto largo (multiline)
export const MULTILINE_FIELDS = new Set([
  "notes",
  "text",
  "diagnosis",
  "result_summary",
  "recovery_notes",
]);

// ─── Interfaces de API ─────────────────────────────────────────────────────────

export interface PetRecordOut {
  id: string;
  pet_id: string;
  type: RecordType;
  title: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  recorded_by_user_id: string | null;
  recorded_by_role: "owner" | "admin" | "system";
  data: Record<string, any>;
  attachment_ids: string[];
  deleted_at: string | null;
}

export interface CreatePetRecordPayload {
  type: RecordType;
  occurred_at: string;
  data: Record<string, any>;
  title?: string | null;
  attachment_ids?: string[];
}

export interface ListRecordsParams {
  type?: RecordType;
  date_from?: string;
  date_to?: string;
  recorded_by_role?: "owner" | "admin";
  limit?: number;
  offset?: number;
}
