import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import {
  CartResponse,
  CreateCartInput,
  ValidateCartResponse,
  CheckoutResponse,
} from "@/types/cart.types";

export const cartService = {
  async getActiveCart(): Promise<CartResponse> {
    const response = await apiClient.get<CartResponse>(API_ENDPOINTS.CART.GET);
    return response.data;
  },

  async createWithItems(input: CreateCartInput): Promise<CartResponse> {
    const response = await apiClient.post<CartResponse>(
      API_ENDPOINTS.CART.CREATE_WITH_ITEMS,
      input,
    );
    return response.data;
  },

  async replaceItems(
    cartId: string,
    input: CreateCartInput,
  ): Promise<CartResponse> {
    const response = await apiClient.put<CartResponse>(
      API_ENDPOINTS.CART.REPLACE_ITEMS(cartId),
      input,
    );
    return response.data;
  },

  async deleteItem(cartId: string, itemId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CART.DELETE_ITEM(cartId, itemId));
  },

  async validate(cartId: string): Promise<ValidateCartResponse> {
    const response = await apiClient.post<ValidateCartResponse>(
      API_ENDPOINTS.CART.VALIDATE(cartId),
    );
    return response.data;
  },

  async checkout(cartId: string): Promise<CheckoutResponse> {
    const response = await apiClient.post<CheckoutResponse>(
      API_ENDPOINTS.CART.CHECKOUT(cartId),
    );
    return response.data;
  },
};
