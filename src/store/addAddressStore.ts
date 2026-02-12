import { create } from "zustand";

interface AddAddressFormData {
  // Paso 1
  district_id: string;
  address_line: string;
  building_number: string;
  apartment_number: string;

  // Paso 2 (mapa)
  lat: number | null;
  lng: number | null;

  // Actions
  setStep1Data: (data: {
    district_id: string;
    address_line: string;
    building_number: string;
    apartment_number: string;
  }) => void;

  setStep2Data: (lat: number, lng: number) => void;

  clearForm: () => void;
}

const initialState = {
  district_id: "",
  address_line: "",
  building_number: "",
  apartment_number: "",
  lat: null,
  lng: null,
};

export const useAddAddressStore = create<AddAddressFormData>((set) => ({
  ...initialState,

  setStep1Data: (data) => {
    set({
      district_id: data.district_id,
      address_line: data.address_line,
      building_number: data.building_number,
      apartment_number: data.apartment_number,
    });
  },

  setStep2Data: (lat, lng) => {
    set({ lat, lng });
  },

  clearForm: () => {
    set(initialState);
  },
}));
