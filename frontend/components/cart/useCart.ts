"use client";

import { useQuery } from "@tanstack/react-query";
import { listCartItems } from "@/lib/api";
import type { CartItem } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

export function useCart() {
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: listCartItems,
    enabled: !!token && bootstrapped,
  });

  const items: CartItem[] = query.data?.data ?? [];
  const count = items.length;
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);

  return { query, items, count, subtotal };
}