import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addCartItem,
  listCartItems,
  removeCartItem,
  updateCartItem,
} from "@/lib/api/cart";
import { CART_SAVE_DEBOUNCE_MS } from "@/lib/config";
import { queryKeys } from "@/lib/query-keys";
import type { CartItem } from "@/lib/types";

/**
 * Per-line write state.
 *
 * `confirmed` is the last value the server actually acknowledged and is what a
 * failed write rolls back to. `target` is the newest value the user asked for,
 * which runs ahead of the server while a change is resting or in the air.
 */
type LineState = {
  confirmed: CartItem | null;
  target: number;
  timer: ReturnType<typeof setTimeout> | null;
  inFlight: Promise<boolean> | null;
};

/** Bounds how many open writes a flush will wait out before giving up. */
const MAX_SETTLE_PASSES = 5;

/**
 * The cart is server-owned, but the write path is not allowed to feel it.
 *
 * Writing straight through on every tap made the stepper unusable: each press
 * cost a full round trip, and `disabled={isMutating}` greyed out *every* line
 * while any one of them was in flight. So a quantity change is applied to the
 * cache immediately and the `PUT` is deferred by a self-resetting debounce
 * (`CART_SAVE_DEBOUNCE_MS`). A burst of taps collapses into one request carrying
 * the final number, while a single tap still lands almost immediately.
 *
 * Three things keep the optimism honest, and all three matter more than speed:
 *
 * 1. There is no bulk endpoint — only `PUT /cart/items/{id}` — so coalescing
 *    happens per line. Taps on *different* lines remain separate requests,
 *    which is all the backend allows.
 * 2. `flushPending` exists because a deferred write that never lands is worse
 *    than the original bug: the server would hold a stale quantity and place
 *    the wrong order. Checkout flushes first and refuses to continue on
 *    failure; unmount flushes whatever is still resting.
 * 3. One request per line is open at a time, and a flush waits for an open one
 *    rather than starting a rival PUT. A settled quantity is final: the API
 *    clamps to available stock and reports the clamped number back, so that is
 *    an answer to adopt, not a value to retry. Re-sending something the server
 *    has already answered is what turns a burst of taps into a request pile-up.
 */
export function useCart(
  enabled = true,
  options: { onSaveError?: (error: unknown) => void } = {}
) {
  const queryClient = useQueryClient();
  const lines = useRef(new Map<string, LineState>());

  // Held in a ref so a caller passing an inline closure does not churn the
  // identity of the callbacks the debounce timers depend on.
  const onSaveError = useRef(options.onSaveError);
  useEffect(() => {
    onSaveError.current = options.onSaveError;
  });

  const query = useQuery({
    queryKey: queryKeys.cart.items,
    queryFn: listCartItems,
    enabled,
    select: (res) => res.data,
  });

  /** Writes the item list, tolerating a cache that has not seeded yet. */
  const writeItems = useCallback(
    (updater: (items: CartItem[]) => CartItem[]) => {
      queryClient.setQueryData<{ data: CartItem[] }>(
        queryKeys.cart.items,
        (previous) => ({ data: updater(previous?.data ?? []) })
      );
    },
    [queryClient]
  );

  /** Only ever called from handlers, never while rendering. */
  const lineState = useCallback((id: string): LineState => {
    const existing = lines.current.get(id);
    if (existing) return existing;
    const created: LineState = {
      confirmed: null,
      target: 0,
      timer: null,
      inFlight: null,
    };
    lines.current.set(id, created);
    return created;
  }, []);

  const sendLine = useCallback(
    async (id: string, quantity: number): Promise<boolean> => {
      const state = lineState(id);

      const run = async (): Promise<boolean> => {
        try {
          const response = await updateCartItem(id, quantity);
          state.confirmed = response.data;
          // The server is authoritative. A quantity it clamped down to the
          // available stock is an answer, not a failure — adopt it as the
          // settled target, unless the user asked for something newer while
          // this request was in the air, which must not be clobbered.
          if (state.target === quantity) state.target = response.data.quantity;
          // Replace the whole line so the server's own `line_total` wins.
          writeItems((items) =>
            items.map((item) => (item.id === id ? response.data : item))
          );
          return true;
        } catch (error) {
          onSaveError.current?.(error);
          const rollback = state.confirmed;
          if (rollback) {
            writeItems((items) =>
              items.map((item) => (item.id === id ? rollback : item))
            );
            // Abandon only the value that was actually rejected; a newer tap
            // asked for something else and still deserves to go out.
            if (state.target === quantity) state.target = rollback.quantity;
          }
          return false;
        }
      };

      // `inFlight` is set synchronously with the call, so a second flush for
      // this line waits instead of racing a rival PUT for the same quantity.
      const pending = run();
      state.inFlight = pending;
      try {
        return await pending;
      } finally {
        if (state.inFlight === pending) state.inFlight = null;
      }
    },
    [lineState, writeItems]
  );

  /**
   * Sends the line's resting change now and waits for it to actually land,
   * including a request that was already open when the flush was called.
   *
   * At most one PUT per line per call: a settled line is a no-op, and the only
   * reason to send twice is a tap that arrived mid-flight, which terminates
   * because each pass either adopts the server's quantity or sends the newer
   * one.
   */
  const flushLine = useCallback(
    async (id: string): Promise<boolean> => {
      const state = lineState(id);
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }

      for (let waited = 0; state.inFlight && waited < MAX_SETTLE_PASSES; waited += 1) {
        await state.inFlight;
      }

      if (!state.confirmed || state.confirmed.quantity === state.target) {
        return true;
      }
      return sendLine(id, state.target);
    },
    [lineState, sendLine]
  );

  /** Applies the quantity locally, then restarts the write timer. */
  const setQuantity = useCallback(
    (item: CartItem, quantity: number) => {
      const state = lineState(item.id);
      state.target = quantity;
      if (!state.confirmed) state.confirmed = item;

      // Synchronous: the abort is dispatched before this tick ends, so a refetch
      // in flight cannot land on top of the optimistic value.
      void queryClient.cancelQueries({ queryKey: queryKeys.cart.items });
      writeItems((items) =>
        items.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                quantity,
                // A display-only guess. The server's `line_total` replaces it as
                // soon as the write is acknowledged.
                line_total: quantity * entry.product.price,
              }
            : entry
        )
      );

      if (state.timer) clearTimeout(state.timer);
      state.timer = setTimeout(() => {
        state.timer = null;
        void flushLine(item.id);
      }, CART_SAVE_DEBOUNCE_MS);
    },
    [flushLine, lineState, queryClient, writeItems]
  );

  /**
   * Sends every resting change now. Resolves false if any line failed, so the
   * caller can refuse to continue on a quantity the server rejected.
   */
  const flushPending = useCallback(async (): Promise<boolean> => {
    const results = await Promise.all(
      [...lines.current.keys()].map((id) => flushLine(id))
    );
    return results.every(Boolean);
  }, [flushLine]);

  /** Drops a line's resting write — it is about to be deleted anyway. */
  const cancelLine = useCallback((id: string) => {
    const state = lines.current.get(id);
    if (state?.timer) clearTimeout(state.timer);
    lines.current.delete(id);
  }, []);

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
    mutationFn: async (id: string) => {
      cancelLine(id);
      return removeCartItem(id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });

  // Never let a resting write die with the screen; the server still holds the
  // old quantity and checkout would place it.
  useEffect(() => {
    const resting = lines.current;
    return () => {
      for (const [id, state] of resting) {
        if (state.timer) {
          clearTimeout(state.timer);
          state.timer = null;
        }
        if (state.inFlight) {
          void state.inFlight;
        } else if (state.confirmed && state.confirmed.quantity !== state.target) {
          void updateCartItem(id, state.target).catch(() => {
            /* the next cart load shows the server's truth */
          });
        }
      }
    };
  }, []);

  const items = query.data ?? [];

  return {
    items,
    query,
    add,
    update,
    remove,
    setQuantity,
    flushPending,
    count: items.length,
    /**
     * Sum of `line_total`. Server-reported for every settled line, optimistic
     * for a line mid-edit — which is the whole point.
     */
    subtotal: items.reduce((sum, item) => sum + item.line_total, 0),
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    isMutating: add.isPending || update.isPending || remove.isPending,
  };
}

export type { CartItem };