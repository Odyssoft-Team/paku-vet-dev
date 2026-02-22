export interface CreateOrderInput {
  cart_id: string;
  address_id: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  items_snapshot: string;
  total_snapshot: number;
  currency: string;
  delivery_address_snapshot: Record<string, any>;
  created_at: string;
  updated_at: string;
}
