export type ClinicalHistory = {
  id: string;
  pet_id: string;
  type: string;
  summary: string;
  created_at?: string;
  // Campos adicionales para registros de estética/detalle
  doctor?: string;
  stats?: {
    weight: string;
    skinStatus: string;
    furStatus: string;
  };
  visualRegistry?: string[];
  observations?: string;
};
