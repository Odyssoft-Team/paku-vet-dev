import { z } from "zod";

// Schema para login
export const loginSchema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Schema para registro básico (por ahora)
export const registerSchema = z
  .object({
    first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    last_name: z
      .string()
      .min(2, "El apellido debe tener al menos 2 caracteres"),
    email: z.string().min(1, "El email es requerido").email("Email inválido"),
    phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    sex: z.enum(["male", "female"], {
      errorMap: () => ({ message: "Selecciona un género" }),
    }),
    birth_date: z.string().min(1, "La fecha de nacimiento es requerida"),
    dni: z.string().optional(),
    address_line: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const addAddressStep1Schema = z.object({
  district_id: z.string().min(1, "Selecciona un distrito"),
  address_line: z
    .string()
    .min(3, "La dirección debe tener al menos 3 caracteres"),
  building_number: z.string().optional(),
  apartment_number: z.string().optional(),
});

// ============================================
// REGISTRO DE MASCOTA - PASO 1: Información básica
// ============================================
export const petStep1Schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  species: z.enum(["dog", "cat"], {
    errorMap: () => ({ message: "Selecciona una especie" }),
  }),
  breed: z.string().min(2, "La raza debe tener al menos 2 caracteres"),
  sex: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Selecciona el sexo" }),
  }),
  birth_date: z.string().min(1, "La fecha de nacimiento es requerida"),
  sterilized: z.boolean(),
  photo_url: z.string().optional(), // Para foto local, luego se subirá
});

export type PetStep1FormData = z.infer<typeof petStep1Schema>;

// ============================================
// REGISTRO DE MASCOTA - PASO 2: Características físicas
// ============================================
export const petStep2Schema = z.object({
  size: z.enum(["small", "medium", "large"], {
    errorMap: () => ({ message: "Selecciona el tamaño" }),
  }),
  weight_kg: z.number().min(0).optional(), // Opcional
  activity_level: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "Selecciona el nivel de actividad" }),
  }),
  coat_type: z.enum(["short", "medium", "long"], {
    errorMap: () => ({ message: "Selecciona el tipo de pelaje" }),
  }),
  skin_sensitivity: z.boolean(),
});

export type PetStep2FormData = z.infer<typeof petStep2Schema>;

// ============================================
// REGISTRO DE MASCOTA - PASO 3: Comportamiento
// ============================================
export const petStep3Schema = z.object({
  bath_behavior: z.enum(["calm", "fearful", "anxious"], {
    errorMap: () => ({ message: "Selecciona el comportamiento" }),
  }),
  tolerates_drying: z.boolean(),
  tolerates_nail_clipping: z.boolean(),
  vaccines_up_to_date: z.boolean(),
  notes: z.string().optional(), // Para condiciones médicas/medicación
});

export type PetStep3FormData = z.infer<typeof petStep3Schema>;

// ============================================
// REGISTRO DE MASCOTA - PASO 4: Cuidados
// ============================================
export const petStep4Schema = z.object({
  grooming_frequency: z.string().optional(),
  receive_reminders: z.boolean(),
  antiparasitic: z.boolean(),
  antiparasitic_interval: z
    .enum(["monthly", "trimestral", "biannual"])
    .optional(),
  special_shampoo: z.boolean(),
});

export type PetStep4FormData = z.infer<typeof petStep4Schema>;

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export type AddAddressStep1FormData = z.infer<typeof addAddressStep1Schema>;
