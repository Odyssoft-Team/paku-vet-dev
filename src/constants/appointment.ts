type AppointmentType =
  | "Revisión veterinaria"
  | "Vacunación"
  | "Desparasitación"
  | "Cirugía";

interface Attachment {
  name: string;
  url: string;
  fileType: "pdf" | "image" | "doc";
}

export interface Appointment {
  id: string;
  type: AppointmentType;
  date: string;
  doctor: string;
  details: {
    reason: string; // Motivo
    diagnosis: string; // Diagnóstico
    treatment: string; // Tratamiento
  };

  // Documentos adjuntos
  attachments?: Attachment[];

  // Observaciones adicionales
  observations?: string;
}

export const SALUD_LIST: Appointment[] = [
  {
    id: "1",
    type: "Revisión veterinaria",
    date: "18/12/2025",
    doctor: "Dr. Green",
    details: {
      reason: "Control general",
      diagnosis: "Mascota en buen estado",
      treatment: "No requerido",
    },
    attachments: [
      { name: "Informe.pdf", url: "...", fileType: "pdf" },
      { name: "Foto receta.jpg", url: "...", fileType: "image" },
    ],
    observations: "Mascota tranquila durante la revisión",
  },
  {
    id: "2",
    type: "Vacunación",
    date: "05/02/2026",
    doctor: "Dra. Casas",
    details: {
      reason: "Refuerzo anual",
      diagnosis: "Esquema de vacunación al día",
      treatment: "Vacuna Quíntuple aplicada",
    },
    attachments: [
      { name: "Carnet_Vacunas.png", url: "...", fileType: "image" },
    ],
    observations:
      "Se recomienda observación por 24 horas ante posible letargo.",
  },
];
