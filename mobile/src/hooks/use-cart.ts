import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addCartItem,
  listCartItems,
  removeCartItem,
  updateCartItem,
} from "@/lib/api/cart";
import { errorMessage } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query-keys";
import type { CartItem } from "@/lib/types";

/**
 * The cart is server-owned.
 *
 * Quantities are written straight through on every change rather than held in
 * local optimistic state: the API rejects a quantity that exceeds current stock
 * with a 409 carrying the real available count, and a locally-guessed number
 * would drift out of sync with the order that actually gets placed.
 */
export function useCart(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.cart.items,
    queryFn: listCartItems,
    enabled,
    select: (res) => res.data,
  });

  /** Applies a 409 back onto the affected line so the stepper corrects itself. */
  const reportError = (error: unknown) => errorMessage(error);

  const add = useMutation({
    mutationFn: (input: { productId: string; quantity: number }) =>
      addCartItem({ product_id: input.productId, quantity: input.quantity }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });

  const update = useMutation({
    mutationFn: (input: { id: string; quantity: number }) =>
      updateCartItem(input.id, input.quantity),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });

  const remove = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });

  const items = query.data ?? [];

  return {
    items,
    query,
    add,
    update,
    remove,
    reportError,
    count: items.length,
    /** Sum of `line_total` as reported by the server, never recomputed locally. */
    subtotal: items.reduce((sum, item) => sum + item.line_total, 0),
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    isMutating: add.isPending || update.isPending || remove.isPending,
  };
}

export type { CartItem };
