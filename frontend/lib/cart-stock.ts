import type { CartItem } from "@/lib/types";

export const MAX_CART_QUANTITY = 100;

/** Stock the API reported for the line, or null when the payload omitted it. */
export function availableStock(item: CartItem): number | null {
  return typeof item.product.stock === "number" ? item.product.stock : null;
}

/** True when the cart holds more of the product than the API says is available. */
export function isOverStock(item: CartItem): boolean {
  const available = availableStock(item);
  return available !== null && item.quantity > available;
}

/** Upper bound for the stepper, never below the minimum so the control stays usable. */
export function maxSelectable(item: CartItem): number {
  const available = availableStock(item);
  if (available === null) return MAX_CART_QUANTITY;
  return Math.max(1, Math.min(MAX_CART_QUANTITY, available));
}
