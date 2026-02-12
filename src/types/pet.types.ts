export type PetSpecies = "dog" | "cat";
export type PetSex = "male" | "female";
export type PetSize = "small" | "medium" | "large";
export type PetActivityLevel = "low" | "medium" | "high";
export type PetCoatType = "short" | "medium" | "long";
export type PetBathBehavior = "calm" | "nervous" | "aggressive";
export type AntiparasiticInterval = "monthly" | "quarterly" | "biannual";

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  sex: PetSex;
  birth_date: string;
  notes?: string;
  created_at: string;
  photo_url?: string;
  weight_kg: number;
  updated_at: string;
  sterilized: boolean;
  size: PetSize;
  activity_level: PetActivityLevel;
  coat_type: PetCoatType;
  skin_sensitivity: boolean;
  bath_behavior: PetBathBehavior;
  tolerates_drying: boolean;
  tolerates_nail_clipping: boolean;
  vaccines_up_to_date: boolean;
  grooming_frequency?: string;
  receive_reminders: boolean;
  antiparasitic: boolean;
  antiparasitic_interval?: AntiparasiticInterval;
  special_shampoo: boolean;
}

export interface CreatePetData {
  name: string;
  species: PetSpecies;
  breed: string;
  sex: PetSex;
  birth_date: string;
  notes?: string;
  sterilized: boolean;
  size: PetSize;
  weight_kg: number;
  activity_level: PetActivityLevel;
  coat_type: PetCoatType;
  skin_sensitivity: boolean;
  bath_behavior: PetBathBehavior;
  tolerates_drying: boolean;
  tolerates_nail_clipping: boolean;
  vaccines_up_to_date: boolean;
  grooming_frequency?: string;
  receive_reminders: boolean;
  antiparasitic: boolean;
  antiparasitic_interval?: AntiparasiticInterval;
  special_shampoo: boolean;
}

export interface GetPetsParams {
  limit?: number;
  offset?: number;
}
