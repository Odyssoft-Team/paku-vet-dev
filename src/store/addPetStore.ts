import { create } from "zustand";

interface AddPetFormData {
  // Paso 1
  name: string;
  species: "dog" | "cat" | "";
  breed: string;
  sex: "male" | "female" | "";
  birth_date: string;
  sterilized: boolean;
  photo_url?: string;

  // Paso 2
  size: "small" | "medium" | "large" | "";
  weight_kg?: number;
  activity_level: "low" | "medium" | "high" | "";
  coat_type: "short" | "medium" | "long" | "";
  skin_sensitivity: boolean;

  // Paso 3
  bath_behavior: "calm" | "fearful" | "anxious" | "";
  tolerates_drying: boolean;
  tolerates_nail_clipping: boolean;
  vaccines_up_to_date: boolean;
  notes?: string;

  // Paso 4
  grooming_frequency?: string;
  receive_reminders: boolean;
  antiparasitic: boolean;
  antiparasitic_interval?: "monthly" | "trimestral" | "biannual";
  special_shampoo: boolean;

  // Actions
  setStep1Data: (data: Partial<AddPetFormData>) => void;
  setStep2Data: (data: Partial<AddPetFormData>) => void;
  setStep3Data: (data: Partial<AddPetFormData>) => void;
  setStep4Data: (data: Partial<AddPetFormData>) => void;
  clearForm: () => void;
}

const initialState = {
  // Paso 1
  name: "",
  species: "" as const,
  breed: "",
  sex: "" as const,
  birth_date: "",
  sterilized: false,
  photo_url: undefined,

  // Paso 2
  size: "" as const,
  weight_kg: undefined,
  activity_level: "" as const,
  coat_type: "" as const,
  skin_sensitivity: false,

  // Paso 3
  bath_behavior: "" as const,
  tolerates_drying: false,
  tolerates_nail_clipping: false,
  vaccines_up_to_date: false,
  notes: undefined,

  // Paso 4
  grooming_frequency: undefined,
  receive_reminders: false,
  antiparasitic: false,
  antiparasitic_interval: undefined,
  special_shampoo: false,
};

export const useAddPetStore = create<AddPetFormData>((set) => ({
  ...initialState,

  setStep1Data: (data) => {
    set((state) => ({ ...state, ...data }));
  },

  setStep2Data: (data) => {
    set((state) => ({ ...state, ...data }));
  },

  setStep3Data: (data) => {
    set((state) => ({ ...state, ...data }));
  },

  setStep4Data: (data) => {
    set((state) => ({ ...state, ...data }));
  },

  clearForm: () => {
    set(initialState);
  },
}));
