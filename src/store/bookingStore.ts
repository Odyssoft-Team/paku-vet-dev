import { create } from "zustand";

interface InvoiceData {
  ruc: string;
  razonSocial: string;
  correo: string;
}

interface BookingState {
  petId: string | null;

  serviceId: string | null;
  serviceCode: string | null;
  serviceName: string | null;
  servicePrice: number | null;

  // Addon — mapeado pero no activo en v1
  extraId: string | null;
  extraLabel: string | null;
  extraPrice: number | null;

  addressId: string | null;

  selectedDate: string | null;
  selectedTime: string | null; // siempre "12:00" por ahora

  appliedCoupon: string | null;
  couponDiscount: number;

  needsInvoice: boolean;
  invoiceData: InvoiceData | null;

  cartId: string | null; // id del carrito backend tras createWithItems

  setPet: (petId: string) => void;
  setService: (data: {
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    servicePrice: number;
  }) => void;
  setExtra: (
    data: { extraId: string; extraLabel: string; extraPrice: number } | null,
  ) => void;
  setAddress: (addressId: string) => void;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  setCartId: (cartId: string) => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setInvoice: (data: InvoiceData) => void;
  removeInvoice: () => void;
  clearBooking: () => void;
}

const initialState = {
  petId: null,
  serviceId: null,
  serviceCode: null,
  serviceName: null,
  servicePrice: null,
  extraId: null,
  extraLabel: null,
  extraPrice: null,
  addressId: null,
  selectedDate: null,
  selectedTime: null,
  appliedCoupon: null,
  couponDiscount: 0,
  needsInvoice: false,
  invoiceData: null,
  cartId: null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,
  setPet: (petId) => set({ petId }),
  setService: ({ serviceId, serviceCode, serviceName, servicePrice }) =>
    set({ serviceId, serviceCode, serviceName, servicePrice }),
  setExtra: (data) =>
    data
      ? set({
          extraId: data.extraId,
          extraLabel: data.extraLabel,
          extraPrice: data.extraPrice,
        })
      : set({ extraId: null, extraLabel: null, extraPrice: null }),
  setAddress: (addressId) => set({ addressId }),
  setDate: (date) => set({ selectedDate: date }),
  setTime: (time) => set({ selectedTime: time }),
  setCartId: (cartId) => set({ cartId }),
  applyCoupon: (code, discount) =>
    set({ appliedCoupon: code, couponDiscount: discount }),
  removeCoupon: () => set({ appliedCoupon: null, couponDiscount: 0 }),
  setInvoice: (data) => set({ needsInvoice: true, invoiceData: data }),
  removeInvoice: () => set({ needsInvoice: false, invoiceData: null }),
  clearBooking: () => set(initialState),
}));
