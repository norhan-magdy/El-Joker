"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listProducts, listCategories, listOrders, errorMessage } from "@/lib/api";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatShortId, formatDate, formatMoney } from "@/lib/constants";

function StatCard({ label, value, href }: { label: string; value?: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 transition-colors hover:border-text-muted">
        <p className="text-sm text-text-muted">{label}</p>
        {value === undefined ? (
          <Skeleton className="mt-3 h-9 w-16" />
        ) : (
          <p className="mt-2 text-3xl font-semibold tabular-nums text-text-primary">{value}</p>
        )}
      </Card>
    </Link>
  );
}

export function AdminDashboard() {
  const productsQuery = useQuery({ queryKey: ["admin", "products"], queryFn: () => listProducts() });
  const categoriesQuery = useQuery({ queryKey: ["admin", "categories"], queryFn: () => listCategories(1) });
  const ordersQuery = useQuery({ queryKey: ["admin", "orders"], queryFn: () => listOrders(1) });

  if (productsQuery.isError && categoriesQuery.isError && ordersQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load dashboard"
        message={errorMessage(productsQuery.error)}
        onRetry={() => {
          void productsQuery.refetch();
          void categoriesQuery.refetch();
          void ordersQuery.refetch();
        }}
      />
    );
  }

  const recentOrders = ordersQuery.data?.data.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Products" value={productsQuery.data?.meta.total} href="/admin/products" />
        <StatCard label="Categories" value={categoriesQuery.data?.meta.total} href="/admin/categories" />
        <StatCard label="Orders" value={ordersQuery.data?.meta.total} href="/admin/orders" />
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:text-primary-hover">
            View all
          </Link>
        </div>

        {ordersQuery.isPending ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-3 py-2.5 font-medium">Order</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-medium text-primary hover:text-primary-hover"
                      >
                        #{formatShortId(order.id)}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-text-secondary">{formatDate(order.created_at)}</td>
                    <td className="px-3 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {formatMoney(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}