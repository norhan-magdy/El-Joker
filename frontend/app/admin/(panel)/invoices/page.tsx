"use client";

import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { listAdminInvoices, errorMessage } from "@/lib/api";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatShortId, formatDate, formatMoney } from "@/lib/constants";
import { useScrollToTopOnChange } from "@/lib/use-scroll-to-top";
import type { Invoice } from "@/lib/types";

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
            <th className="px-5 py-3 font-medium">Invoice</th>
            <th className="px-5 py-3 font-medium">Customer</th>
            <th className="px-5 py-3 font-medium">Order</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Issued</th>
            <th className="px-5 py-3 text-right font-medium">Total</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-border transition-colors last:border-0 hover:bg-black/[0.02]">
              <td className="px-5 py-3">
                <span className="font-mono font-medium text-text-primary">#{invoice.invoice_number}</span>
              </td>
              <td className="px-5 py-3 text-text-secondary">{invoice.customer?.email ?? "—"}</td>
              <td className="px-5 py-3">
                {invoice.order ? (
                  <span className="font-mono text-text-secondary">#{formatShortId(invoice.order.id)}</span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-3">
                {invoice.order ? <OrderStatusBadge status={invoice.order.status} /> : null}
              </td>
              <td className="px-5 py-3 text-text-secondary">{formatDate(invoice.issued_at)}</td>
              <td className="px-5 py-3 text-right font-medium tabular-nums">
                {formatMoney(invoice.order?.total_amount ?? 0)}
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end">
                  <Button asChild variant="secondary" className="h-8 px-3 text-xs">
                    <Link href={`/admin/invoices/${invoice.id}`}>View</Link>
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

export default function AdminInvoicesPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useScrollToTopOnChange(page);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const query = useQuery({
    queryKey: ["admin", "invoices", { page, q: debouncedQ }],
    queryFn: () => listAdminInvoices({ page, q: debouncedQ }),
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
    return (
      <ErrorState title="Couldn't load invoices" message={errorMessage(query.error)} onRetry={() => query.refetch()} />
    );
  }

  const { data, meta } = query.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Invoices</h1>

      <div className="max-w-md">
        <Input
          type="search"
          value={q}
          placeholder="Search by invoice number, order, or customer…"
          aria-label="Search invoices"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {data.length === 0 ? (
        <EmptyState
          title={debouncedQ ? "No invoices found" : "No invoices yet"}
          caption={
            debouncedQ
              ? "Try adjusting your search."
              : "Invoices are issued automatically when customers place orders."
          }
        />
      ) : (
        <>
          <InvoiceTable invoices={data} />
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