import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/constants";

const STATUS_VARIANT: Record<OrderStatus, "success" | "warning" | "error" | "info" | "neutral"> = {
  pending: "neutral",
  paid: "info",
  shipped: "warning",
  delivered: "success",
  cancelled: "error",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const label = ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
  return <Badge variant={STATUS_VARIANT[status]}>{label}</Badge>;
}