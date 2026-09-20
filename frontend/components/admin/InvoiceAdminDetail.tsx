"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { getAdminInvoice, regenerateAdminInvoice, errorMessage } from "@/lib/api";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatShortId, formatDate, formatMoney } from "@/lib/constants";
import { openInvoicePdf } from "@/lib/download-invoice";

export function InvoiceAdminDetail({ invoiceId }: { invoiceId: string }) {
  const queryClient = useQueryClient();

  const invoiceQuery = useQuery({
    queryKey: ["admin", "invoice", invoiceId],
    queryFn: () => getAdminInvoice(invoiceId),
  });

  const regenerate = useMutation({
    mutationFn: () => regenerateAdminInvoice(invoiceId),
    onSuccess: (res) => {
      toast.success(res.message ?? "Invoice PDF generation queued");
      void queryClient.invalidateQueries({ queryKey: ["admin", "invoice", invoiceId] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (invoiceQuery.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (invoiceQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load invoice"
        message="This invoice may no longer exist."
        onRetry={() => invoiceQuery.refetch()}
      />
    );
  }

  const invoice = invoiceQuery.data.data;
  const items = invoice.order?.items ?? [];
  const canDownload = invoice.pdf_url !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/invoices" className="text-sm font-medium text-primary hover:text-primary-hover">
            ← Back to invoices
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary">
            Invoice <span className="font-mono">#{invoice.invoice_number}</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => invoice.order && void openInvoicePdf(invoice.order.id)} disabled={!canDownload}>
            Download PDF
          </Button>
          <Button variant="secondary" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
            {regenerate.isPending ? "Queuing…" : "Regenerate PDF"}
          </Button>
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Customer</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{invoice.customer?.name ?? "—"}</p>
            <p className="text-sm text-text-secondary">{invoice.customer?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Order</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-sm text-text-primary">
                #{invoice.order ? formatShortId(invoice.order.id) : "—"}
              </span>
              {invoice.order ? <OrderStatusBadge status={invoice.order.status} /> : null}
            </div>
            <p className="mt-1 text-sm text-text-secondary">Placed {invoice.order ? formatDate(invoice.order.created_at) : "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Issued</p>
            <p className="mt-1 text-sm text-text-primary">{formatDate(invoice.issued_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Items</p>
            <p className="mt-1 text-sm text-text-primary">{invoice.items_count ?? items.length}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-text-primary">Items</h2>
        <ul className="mt-4 divide-y divide-border">
          {items.map((item) => (
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
              <span className="shrink-0 text-sm font-medium tabular-nums">{formatMoney(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-text-secondary">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatMoney(invoice.order?.total_amount ?? 0)}</span>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-text-primary">Shipping address</h2>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-background p-4 text-sm leading-6 text-text-secondary">
            {invoice.order?.shipping_address ?? "—"}
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-text-primary">Payments</h2>
          {(invoice.order?.payments ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">No payments recorded.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {(invoice.order?.payments ?? []).map((payment) => (
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
  );
}