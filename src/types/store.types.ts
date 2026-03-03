export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  species: string | null;
  is_active: boolean;
}

export interface StoreProduct {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  species: string;
  allowed_breeds: string[] | null;
  is_active: boolean;
  price: number | null;
  currency: string;
}

export interface StoreAddon {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  species: string;
  allowed_breeds: string[] | null;
  is_active: boolean;
  price: number | null;
  currency: string;
}

export interface StoreProductDetail extends StoreProduct {
  available_addons: StoreAddon[];
}

export interface QuoteRequest {
  pet_id: string;
  product_id: string;
  addon_ids: string[];
}

export interface QuoteResult {
  pet_id: string;
  product: {
    target_id: string;
    name: string;
    price: number;
  };
  addons: {
    target_id: string;
    name: string;
    price: number;
  }[];
  total: number;
  currency: string;
}
