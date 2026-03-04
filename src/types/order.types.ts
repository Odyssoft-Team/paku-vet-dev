export interface CreateOrderInput {
  cart_id: string;
  address_id: string;
}

export type TypeStatus =
  | "created"
  | "accepted"
  | "on_the_way"
  | "in_service"
  | "done"
  | "cancelled";

export interface Order {
  id: string;
  user_id: string;
  status: TypeStatus;
  items_snapshot: OrderItem[];
  total_snapshot: number;
  currency: string;
  delivery_address_snapshot: {
    address_line: string;
    district_id: string;
    reference: string | null;
    building_number: string;
    apartment_number: string | null;
    label: string | null;
    type: string | null;
    lat: number;
    lng: number;
  } | null;
  ally_id: string | null;
  scheduled_at: string | null;
  hold_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  cart_id: string;
  kind: string;
  ref_id: string;
  name: string;
  qty: number;
  unit_price: number;
  meta: {
    pet_id: string;
    scheduled_date: string;
    scheduled_time: string;
    addon_ids: string[];
  };
}
