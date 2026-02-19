import { create } from "zustand";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InvoiceData {
  ruc: string;
  razonSocial: string;
  correo: string;
}

interface BookingState {
  // Step: select-pet
  petId: string | null;

  // Step: service-details (paquete principal)
  serviceCode: string | null;
  serviceName: string | null;
  servicePrice: number | null;

  // Step: additional-service (servicio extra, opcional)
  extraId: string | null;
  extraLabel: string | null;
  extraPrice: number | null;

  // Step: select-address
  addressId: string | null;

  // Step: select-date
  selectedDate: string | null;

  // Step: cart – cupón
  appliedCoupon: string | null;
  couponDiscount: number;

  // Step: cart – factura
  needsInvoice: boolean;
  invoiceData: InvoiceData | null;

  // ─── Actions ────────────────────────────────────────────────────────────────

  setPet: (petId: string) => void;

  setService: (data: {
    serviceCode: string;
    serviceName: string;
    servicePrice: number;
  }) => void;

  setExtra: (
    data: {
      extraId: string;
      extraLabel: string;
      extraPrice: number;
    } | null,
  ) => void;

  setAddress: (addressId: string) => void;

  setDate: (date: string) => void;

  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  setInvoice: (data: InvoiceData) => void;
  removeInvoice: () => void;

  /** Limpia todo el estado al terminar o cancelar el flujo */
  clearBooking: () => void;
}

// ─── Initial state ──────────────────────────────────────────────────────────────

const initialState = {
  petId: null,
  serviceCode: null,
  serviceName: null,
  servicePrice: null,
  extraId: null,
  extraLabel: null,
  extraPrice: null,
  addressId: null,
  selectedDate: null,
  appliedCoupon: null,
  couponDiscount: 0,
  needsInvoice: false,
  invoiceData: null,
};

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setPet: (petId) => {
    set({ petId });
  },

  setService: ({ serviceCode, serviceName, servicePrice }) => {
    set({ serviceCode, serviceName, servicePrice });
  },

  setExtra: (data) => {
    if (!data) {
      set({ extraId: null, extraLabel: null, extraPrice: null });
    } else {
      set({
        extraId: data.extraId,
        extraLabel: data.extraLabel,
        extraPrice: data.extraPrice,
      });
    }
  },

  setAddress: (addressId) => {
    set({ addressId });
  },

  setDate: (date) => {
    set({ selectedDate: date });
  },

  applyCoupon: (code, discount) => {
    set({ appliedCoupon: code, couponDiscount: discount });
  },

  removeCoupon: () => {
    set({ appliedCoupon: null, couponDiscount: 0 });
  },

  setInvoice: (data) => {
    set({ needsInvoice: true, invoiceData: data });
  },

  removeInvoice: () => {
    set({ needsInvoice: false, invoiceData: null });
  },

  clearBooking: () => {
    set(initialState);
  },
}));
