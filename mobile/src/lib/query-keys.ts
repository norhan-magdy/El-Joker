import type { ProductSort } from "@/lib/types";

/**
 * Single source of truth for query keys.
 *
 * Every invalidation after a mutation targets one of these, so key drift
 * between two screens cannot silently leave a stale cache behind. Keys are
 * hierarchical: `queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })`
 * busts every cart-derived query at once.
 */
export const queryKeys = {
  session: {
    me: ["session", "me"] as const,
    adminMe: ["session", "admin-me"] as const,
  },
  catalog: {
    products: (filters: {
      page?: number;
      categorySlugs?: string;
      search?: string;
      sort?: ProductSort;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      /**
       * Part of the key because the endpoint's result depends on it: the admin
       * scope also returns inactive products, so admin rows must not be served
       * from a storefront-scoped cache entry (or the reverse).
       */
      scope?: "public" | "admin";
    }) => ["catalog", "products", filters] as const,
    all: ["catalog"] as const,
    /** Keyed by UUID: the API binds `products/{product}` on the primary key. */
    product: (id: string, scope: "public" | "admin" = "public") =>
      ["catalog", "product", scope, id] as const,
    categories: ["catalog", "categories"] as const,
    category: (id: number) => ["catalog", "category", id] as const,
  },
  cart: {
    all: ["cart"] as const,
    items: ["cart", "items"] as const,
  },
  favorites: {
    all: ["favorites"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (page?: number, status?: string) =>
      ["orders", "list", page ?? null, status ?? null] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  admin: {
    all: ["admin"] as const,
    orders: (page?: number, status?: string) =>
      ["admin", "orders", page ?? null, status ?? null] as const,
    order: (id: string) => ["admin", "order", id] as const,
    metrics: ["admin", "metrics"] as const,
  },
} as const;
