import type { OrderStatus } from "@/lib/types";

/**
 * Order lifecycle rules for the admin console.
 *
 * These are deliberately kept out of the UI component so they stay pure and
 * testable. They are a **UI affordance, not a server guarantee**:
 * `OrderService::updateStatus()` only validates that the status is one of the
 * five known values and then writes it, so an out-of-order transition is applied
 * rather than rejected. Offering the expected next step is what stops staff from
 * having to remember the lifecycle.
 */

/** Sensible forward transitions offered in the admin UI. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/** Marks a status as terminal, which hides the transition control entirely. */
export function isTerminal(status: OrderStatus): boolean {
  return NEXT_STATUSES[status].length === 0;
}
