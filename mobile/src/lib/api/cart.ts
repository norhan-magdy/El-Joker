import type { CartItem, CartItemInput, Product } from "@/lib/types";
import { api } from "./client";

export function listCartItems(): Promise<{ data: CartItem[] }> {
  return api.get<{ data: CartItem[] }>("cart/items", { scope: "customer" });
}

/**
 * Returns 201 when a new line is created and 200 when an existing line is
 * incremented, so never branch on the status code — inspect the payload.
 * Throws a `stock` ApiError (409) when the requested quantity exceeds stock.
 */
export function addCartItem(
  body: CartItemInput
): Promise<{ data: CartItem }> {
  return api.post<{ data: CartItem }>("cart/items", body, {
    scope: "customer",
  });
}

/** Throws `stock` ApiError (409) and leaves the old quantity untouched. */
export function updateCartItem(
  id: string,
  quantity: number
): Promise<{ data: CartItem }> {
  return api.put<{ data: CartItem }>(`cart/items/${id}`, { quantity }, {
    scope: "customer",
  });
}

export function removeCartItem(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`cart/items/${id}`, {
    scope: "customer",
  });
}

export function listFavorites(): Promise<{ data: Product[] }> {
  return api.get<{ data: Product[] }>("favorites", { scope: "customer" });
}

export function addFavorite(
  productId: string
): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    "favorites",
    { product_id: productId },
    { scope: "customer" }
  );
}

export function removeFavorite(
  productId: string
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`favorites/${productId}`, {
    scope: "customer",
  });
}