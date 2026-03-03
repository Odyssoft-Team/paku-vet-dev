import { create } from "zustand";

interface InvoiceData {
  ruc: string;
  razonSocial: string;
  correo: string;
}

interface BookingState {
  petId: string | null;
  petSpecies: string | null; // ← nuevo, necesario para filtros de API

  categorySlug: string | null; // ← reemplaza serviceCode
  productId: string | null; // ← reemplaza serviceId
  productName: string | null; // ← reemplaza serviceName
  selectedAddonIds: string[]; // ← nuevo, antes era extraId único

  quotedTotal: number | null; // ← precio real del /store/quote
  currency: string;

  addressId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;

  appliedCoupon: string | null;
  couponDiscount: number;

  needsInvoice: boolean;
  invoiceData: InvoiceData | null;

  cartId: string | null;

  // Acciones
  setPet: (petId: string, species: string) => void;
  setProduct: (data: {
    productId: string;
    productName: string;
    categorySlug: string;
  }) => void;
  setAddons: (addonIds: string[]) => void;
  setQuotedTotal: (total: number, currency: string) => void;
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
  petSpecies: null,
  categorySlug: null,
  productId: null,
  productName: null,
  selectedAddonIds: [],
  quotedTotal: null,
  currency: "PEN",
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

  setPet: (petId, species) => set({ petId, petSpecies: species }),
  setProduct: ({ productId, productName, categorySlug }) =>
    set({
      productId,
      productName,
      categorySlug,
      selectedAddonIds: [],
      quotedTotal: null,
    }),
  setAddons: (addonIds) => set({ selectedAddonIds: addonIds }),
  setQuotedTotal: (total, currency) => set({ quotedTotal: total, currency }),
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
