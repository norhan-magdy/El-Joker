"use client";

import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { listOrders, errorMessage } from "@/lib/api";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatShortId, formatDate, formatMoney } from "@/lib/constants";
import { openInvoicePdf } from "@/lib/download-invoice";
import { useScrollToTopOnChange } from "@/lib/use-scroll-to-top";
import type { Order } from "@/lib/types";

function OrderTableDesktop({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
            <th className="px-5 py-3 font-medium">Order</th>
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Total</th>
            <th className="px-5 py-3 font-medium">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border transition-colors last:border-0 hover:bg-black/[0.02]">
              <td className="px-5 py-4">
                <Link href={`/orders/${order.id}`} className="font-mono font-medium text-primary hover:text-primary-hover">
                  #{formatShortId(order.id)}
                </Link>
              </td>
              <td className="px-5 py-4 text-text-secondary">{formatDate(order.created_at)}</td>
              <td className="px-5 py-4">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-5 py-4 text-right font-medium tabular-nums">{formatMoney(order.total_amount)}</td>
              <td className="px-5 py-4 text-text-secondary">
                {order.invoice ? (
                  <button
                    type="button"
                    onClick={() => void openInvoicePdf(order.id)}
                    className="cursor-pointer text-primary hover:text-primary-hover"
                  >
                    PDF
                  </button>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderCardList({ orders }: { orders: Order[] }) {
  return (
    <ul className="space-y-3 sm:hidden" aria-label="Orders">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/orders/${order.id}`}
            className="block rounded-lg border border-border bg-surface p-4 shadow-sm"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono font-medium text-primary">#{formatShortId(order.id)}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-2 text-sm text-text-secondary">{formatDate(order.created_at)}</p>
            <p className="mt-1 text-base font-semibold text-text-primary">
              {formatMoney(order.total_amount)}
              {order.invoice && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void openInvoicePdf(order.id);
                  }}
                  className="ml-2 cursor-pointer text-xs font-normal text-primary"
                >
                  PDF ↓
                </button>
              )}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);

  useScrollToTopOnChange(page);

  const query = useQuery({
    queryKey: ["orders", page],
    queryFn: () => listOrders(page),
    placeholderData: keepPreviousData,
  });

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-64" />
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState title="Couldn't load orders" message={errorMessage(query.error)} onRetry={() => query.refetch()} />
    );
  }

  const { data, meta } = query.data;
  const perPage = meta.per_page || 10;
  const lastPage = Math.max(1, Math.ceil(meta.total / perPage));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold leading-tight text-text-primary">Orders</h1>

      {data.length === 0 ? (
        <EmptyState title="No orders yet" caption="When you place an order it will show up here." />
      ) : (
        <>
          <OrderTableDesktop orders={data} />
          <OrderCardList orders={data} />
          {lastPage > 1 && (
            <Pagination
              page={page}
              lastPage={lastPage}
              hasPrev={page > 1}
              hasNext={page < lastPage}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}