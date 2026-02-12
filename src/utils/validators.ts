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

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export type AddAddressStep1FormData = z.infer<typeof addAddressStep1Schema>;
