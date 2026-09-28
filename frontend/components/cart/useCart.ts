"use client";

import { useQuery } from "@tanstack/react-query";
import { listCartItems } from "@/lib/api";
import { isOverStock } from "@/lib/cart-stock";
import type { CartItem } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

export function useCart() {
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: listCartItems,
    enabled: !!token && bootstrapped,
    // stock changes while the user browses, so the cart is re-read on every
    // mount and on every window focus instead of being cached for 30s
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const items: CartItem[] = query.data?.data ?? [];
  const count = items.length;
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const hasStockIssue = items.some(isOverStock);

  return { query, items, count, subtotal, hasStockIssue };
}
