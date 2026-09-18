"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateOrderStatus, errorMessage } from "@/lib/api";
import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: OrderStatus) => updateOrderStatus(orderId, { status: next }),
    onSuccess: () => {
      toast.success("Order status updated");
      void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Order status</h2>
        <p className="mt-0.5 text-sm text-text-muted">Change the lifecycle state of this order.</p>
      </div>
      <Select
        value={status}
        disabled={mutation.isPending}
        onChange={(e) => mutation.mutate(e.target.value as OrderStatus)}
        aria-label="Update order status"
        className="w-full sm:w-44"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
    </Card>
  );
}