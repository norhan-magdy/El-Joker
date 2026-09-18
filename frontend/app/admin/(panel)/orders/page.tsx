"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listOrders, errorMessage } from "@/lib/api";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { formatShortId, formatDate, formatMoney } from "@/lib/constants";
import type { Order } from "@/lib/types";

function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
            <th className="px-5 py-3 font-medium">Order</th>
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Total</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border transition-colors last:border-0 hover:bg-black/[0.02]">
              <td className="px-5 py-3">
                <span className="font-mono font-medium text-text-primary">#{formatShortId(order.id)}</span>
              </td>
              <td className="px-5 py-3 text-text-secondary">{formatDate(order.created_at)}</td>
              <td className="px-5 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-5 py-3 text-right font-medium tabular-nums">{formatMoney(order.total_amount)}</td>
              <td className="px-5 py-3">
                <div className="flex justify-end">
                  <Button asChild variant="secondary" className="h-8 px-3 text-xs">
                    <Link href={`/admin/orders/${order.id}`}>View</Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "orders", page],
    queryFn: () => listOrders(page),
    placeholderData: keepPreviousData,
  });

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState title="Couldn't load orders" message={errorMessage(query.error)} onRetry={() => query.refetch()} />;
  }

  const { data, meta } = query.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>

      {data.length === 0 ? (
        <EmptyState title="No orders yet" caption="Orders placed in the store will appear here." />
      ) : (
        <>
          <OrderTable orders={data} />
          {meta.last_page > 1 && (
            <Pagination
              page={page}
              lastPage={meta.last_page}
              hasPrev={page > 1}
              hasNext={page < meta.last_page}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}