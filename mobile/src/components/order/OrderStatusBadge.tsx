import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { isTerminal, NEXT_STATUSES } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";

const STATUS_TONES: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  paid: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

/**
 * Order status badge.
 *
 * A status the API adds later falls through to a neutral badge rather than
 * throwing, so a new server-side status cannot crash the order screens. The
 * transition rules live in `@/lib/order-status` so they can be tested without
 * mounting this component.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return <Badge label={label} tone={STATUS_TONES[status] ?? "neutral"} />;
}

export { isTerminal, NEXT_STATUSES };
