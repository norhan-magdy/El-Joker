"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getOrder, errorMessage } from "@/lib/api";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Card } from "@/components/ui/Card";
import { formatDate, formatShortId, formatMoney } from "@/lib/constants";

export function OrderDetail({ orderId }: { orderId: string }) {
  const query = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
  });

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load order"
        message={
          (query.error as { status?: number })?.status === 404
            ? "This order doesn't exist or is no longer available."
            : errorMessage(query.error)
        }
        onRetry={() => query.refetch()}
      />
    );
  }

  const order = query.data.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">
          Order <span className="font-mono">#{formatShortId(order.id)}</span>
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-text-primary">Items</h2>
        <ul className="mt-4 divide-y divide-border">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <Link
                href={`/products/${item.product.id}`}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-background"
              >
                <ImageWithFallback src={item.product.image_url} alt={item.product.title} sizes="48px" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.product.id}`}
                  className="line-clamp-1 text-sm font-medium text-text-primary hover:text-primary"
                >
                  {item.product.title}
                </Link>
                <p className="text-xs text-text-muted">
                  {formatMoney(item.unit_price)} × {item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatMoney(item.line_total)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-text-secondary">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatMoney(order.total_amount)}</span>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-text-primary">Shipping address</h2>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-background p-4 text-sm leading-6 text-text-secondary">
            {order.shipping_address}
          </p>
          <p className="mt-4 text-xs text-text-muted">Placed {formatDate(order.created_at)}</p>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-text-primary">Invoice</h2>
            {order.invoice ? (
              <div className="mt-2 space-y-1 text-sm text-text-secondary">
                <p>
                  #{order.invoice.invoice_number} · issued {formatDate(order.invoice.issued_at)}
                </p>
                {order.invoice.pdf_url ? (
                  <Link
                    href={order.invoice.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-hover"
                  >
                    <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                    </svg>
                    Download PDF
                  </Link>
                ) : (
                  <p className="text-xs text-text-muted">PDF is not available yet.</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-text-muted">No invoice has been issued for this order.</p>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-text-primary">Payments</h2>
            {(order.payments ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">No payments recorded.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {(order.payments ?? []).map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-text-secondary">{formatDate(payment.created_at)}</span>
                    <span className="font-medium tabular-nums">{formatMoney(payment.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}