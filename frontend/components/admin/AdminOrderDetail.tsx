"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getOrder } from "@/lib/api";
import { OrderDetail } from "@/components/orders/OrderDetail";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { PaymentForm } from "@/components/admin/PaymentForm";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Order } from "@/lib/types";

export function AdminOrderDetail({ orderId }: { orderId: string }) {
  const [payOpen, setPayOpen] = useState(false);

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
  });

  if (orderQuery.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load order"
        message="This order may no longer exist."
        onRetry={() => orderQuery.refetch()}
      />
    );
  }

  const order: Order = orderQuery.data.data;
  const canRecordPayment = order.status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:text-primary-hover">
            ← Back to orders
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary">Order detail</h1>
        </div>
        <Button onClick={() => setPayOpen(true)} disabled={!canRecordPayment} variant="secondary">
          {canRecordPayment ? "Record payment" : "Payment disabled"}
        </Button>
      </div>

      <OrderStatusControl orderId={orderId} status={order.status} />

      <OrderDetail orderId={orderId} />

      {!canRecordPayment && (
        <p className="rounded-lg bg-error-bg p-3 text-sm text-error">
          Payment can only be recorded while the order is pending.
        </p>
      )}

      <PaymentForm orderId={orderId} open={payOpen} onClose={() => setPayOpen(false)} />
    </div>
  );
}