export type CartItemKind = "service_base" | "addon";

export interface CartItemMeta {
  pet_id?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  [key: string]: any;
}

export interface CartItem {
  id: string;
  cart_id: string;
  kind: CartItemKind;
  ref_id: string;
  name: string;
  qty: number;
  unit_price: number;
  meta: CartItemMeta;
}

export interface Cart {
  id: string;
  user_id: string;
  status: "active" | "checked_out" | "expired";
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  cart: Cart;
  items: CartItem[];
}

export interface CreateCartItemInput {
  kind: CartItemKind;
  ref_id: string;
  name: string;
  qty: number;
  unit_price: number;
  meta?: CartItemMeta;
}

export interface CreateCartInput {
  items: CreateCartItemInput[];
}

export interface ValidateCartResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  total: number;
  currency: string;
}

export interface CheckoutResponse {
  cart_id: string;
  status: string;
  total: number;
  currency: string;
  items: CartItem[];
}
