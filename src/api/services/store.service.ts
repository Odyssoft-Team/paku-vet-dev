import apiClient from "../client";
import {
  StoreCategory,
  StoreProduct,
  StoreProductDetail,
  QuoteRequest,
  QuoteResult,
} from "@/types/store.types";

export const storeService = {
  getCategories: async (species?: string): Promise<StoreCategory[]> => {
    const params = species ? { species } : {};
    const response = await apiClient.get<StoreCategory[]>("/store/categories", {
      params,
    });
    return response.data;
  },

  getProductsByCategory: async (
    slug: string,
    params?: { pet_id?: string; species?: string },
  ): Promise<StoreProduct[]> => {
    const response = await apiClient.get<StoreProduct[]>(
      `/store/categories/${slug}/products`,
      { params },
    );
    return response.data;
  },

  getProduct: async (
    id: string,
    pet_id?: string,
  ): Promise<StoreProductDetail> => {
    const params = pet_id ? { pet_id } : {};
    const response = await apiClient.get<StoreProductDetail>(
      `/store/products/${id}`,
      { params },
    );
    return response.data;
  },

  quote: async (body: QuoteRequest): Promise<QuoteResult> => {
    const response = await apiClient.post<QuoteResult>("/store/quote", body);
    return response.data;
  },
};
