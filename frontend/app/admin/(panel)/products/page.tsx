"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { listProducts, deleteProduct, errorMessage } from "@/lib/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatMoney } from "@/lib/constants";
import { useScrollToTopOnChange } from "@/lib/use-scroll-to-top";
import type { Product } from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";


function ProductTable({ products, onDelete }: { products: Product[]; onDelete: (product: Product) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
            <th className="px-5 py-3 font-medium">Product</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Price</th>
            <th className="px-5 py-3 font-medium">Stock</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-border transition-colors last:border-0 hover:bg-overlay">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                    <ImageWithFallback src={product.image_url} alt={product.title} sizes="40px" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="line-clamp-1 font-medium text-text-primary hover:text-primary"
                    >
                      {product.title}
                    </Link>
                    <p className="font-mono text-xs text-text-muted">{product.slug}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-text-secondary">{product.category?.name ?? "—"}</td>
              <td className="px-5 py-3 font-medium tabular-nums">{formatMoney(product.price)}</td>
              <td className="px-5 py-3 tabular-nums text-text-secondary">
                {typeof product.stock === "number" ? product.stock : "∞"}
              </td>
              <td className="px-5 py-3">
                <Badge variant={product.is_active ? "success" : "neutral"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="secondary" className="h-8 px-3 text-xs">
                    <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-xs text-error hover:bg-error-bg"
                    onClick={() => onDelete(product)}
                  >
                    Delete
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

function ProductCardList({ products, onDelete }: { products: Product[]; onDelete: (product: Product) => void }) {
  return (
    <ul className="space-y-3 sm:hidden" aria-label="Products">
      {products.map((product) => (
        <li key={product.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-background">
            <ImageWithFallback src={product.image_url} alt={product.title} sizes="56px" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="line-clamp-1 font-medium text-text-primary hover:text-primary"
            >
              {product.title}
            </Link>
            <p className="mt-0.5 text-sm tabular-nums">{formatMoney(product.price)}</p>
            <div className="mt-1">
              <Badge variant={product.is_active ? "success" : "neutral"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" icon aria-label={`Delete ${product.title}`} onClick={() => onDelete(product)}>
            <svg aria-hidden className="h-4 w-4 text-error" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482 41.03 41.03 0 0 0-2.365-.298V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z" clipRule="evenodd" />
            </svg>
          </Button>
        </li>
      ))}
    </ul>
  );
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  useScrollToTopOnChange(page);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const query = useQuery({
    queryKey: ["admin", "products", { page, q: debouncedQ, status }],
    queryFn: () => listProducts({ page, q: debouncedQ }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(deleteTarget!.id),
    onSuccess: () => {
      toast.success("Product deleted");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const filtered =
    query.data?.data.filter((p) => (status === "all" ? true : p.is_active === (status === "active"))) ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-56 flex-1">
          <Input
            type="search"
            value={q}
            placeholder="Search products…"
            aria-label="Search products"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            setPage(1);
          }}
          aria-label="Filter by status"
          className="w-44"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {query.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : query.isError ? (
        <ErrorState title="Couldn't load products" message={errorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No products found"
          caption="Try adjusting your search or filters, or add a new product."
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/products/new">Add product</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ProductTable products={filtered} onDelete={setDeleteTarget} />
          <ProductCardList products={filtered} onDelete={setDeleteTarget} />
        </>
      )}

      {meta && meta.last_page > 1 && (
        <Pagination
          page={page}
          lastPage={meta.last_page}
          hasPrev={page > 1}
          hasNext={page < meta.last_page}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete product"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This can't be undone.`}
        confirmText="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}