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
  items_snapshot: Record<string, any>;
  total_snapshot: number;
  currency: string;
  delivery_address_snapshot: {
    address_line: string;
    district_id: string;
    lat: number;
    lng: number;
  } | null;
  ally_id: string | null; // Importante: puede ser null al crear
  scheduled_at: string | null; // Importante: puede ser null al crear
  hold_id?: string | null;
  created_at: string;
  updated_at: string;
}
