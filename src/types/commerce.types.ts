export type ServiceType = "base" | "addon";
export type ServiceSpecies = "dog" | "cat";

export interface CommerceService {
  id: string;
  name: string;
  type: ServiceType;
  species: ServiceSpecies;
  allowed_breeds: string[] | null;
  requires: string[] | null; // IDs de servicios base requeridos
  is_active: boolean;
}
