import type { OrderStatus, ProductSort } from "@/lib/types";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const PRODUCT_SORTS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return currencyFormatter.format(value);
}

export function formatShortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/**
 * The stock thresholds mirror `docs/cart-stock-availability-plan.md`.
 * `stock` is optional because the API only sends it when `inventory` was
 * eager-loaded, so treat absence as "unknown", never as "in stock".
 */
export function stockState(
  stock: number | undefined
):
  | { kind: "unknown" }
  | { kind: "out" }
  | { kind: "low"; remaining: number }
  | { kind: "available" } {
  if (typeof stock !== "number") return { kind: "unknown" };
  if (stock <= 0) return { kind: "out" };
  if (stock <= 5) return { kind: "low", remaining: stock };
  return { kind: "available" };
}

export function stockLabel(stock: number | undefined): string {
  const state = stockState(stock);
  switch (state.kind) {
    case "out":
      return "Out of stock";
    case "low":
      return `Only ${state.remaining} left in stock`;
    case "available":
      return "In stock";
    default:
      return "Availability confirmed at checkout";
  }
}

export function canAddToCart(stock: number | undefined): boolean {
  return typeof stock === "number" ? stock > 0 : true;
}

/**
 * Highest quantity a cart line may hold right now. The API enforces both the
 * hard cap and current stock, and answers with a 409 carrying `available`.
 */
export function maxSelectable(
  stock: number | undefined,
  hardMax = 100
): number {
  if (typeof stock !== "number") return hardMax;
  return Math.max(0, Math.min(hardMax, stock));
}

export function clampQuantity(
  value: number,
  stock: number | undefined,
  min = 1,
  hardMax = 100
): number {
  const ceiling = maxSelectable(stock, hardMax);
  if (ceiling < min) return min;
  return Math.min(Math.max(Math.round(value), min), ceiling);
}