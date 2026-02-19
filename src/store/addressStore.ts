import { create } from "zustand";
import { Address, CreateAddressData } from "@/types/address.types";
import { addressService } from "@/api/services/address.service";

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;

  fetchAddresses: () => Promise<void>;
  createAddress: (data: CreateAddressData) => Promise<Address>;
  setDefaultAddress: (id: string) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,

  fetchAddresses: async () => {
    try {
      set({ isLoading: true, error: null });
      const addresses = await addressService.getAddresses();

      set({ addresses, isLoading: false });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al cargar direcciones";
      set({ error: errorMessage, isLoading: false });
    }
  },

  createAddress: async (data: CreateAddressData) => {
    try {
      set({ isLoading: true, error: null });
      const newAddress = await addressService.createAddress(data);

      const { addresses } = get();
      set({
        addresses: [...addresses, newAddress],
        isLoading: false,
      });

      return newAddress;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al crear dirección";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  setDefaultAddress: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      // Actualizar la dirección como predeterminada
      await addressService.updateAddress(id, { is_default: true });

      // Recargar todas las direcciones
      await get().fetchAddresses();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al actualizar dirección";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteAddress: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await addressService.deleteAddress(id);

      const { addresses } = get();
      set({
        addresses: addresses.filter((addr) => addr.id !== id),
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al eliminar dirección";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
