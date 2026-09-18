"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getProduct, errorMessage } from "@/lib/api";
import { ProductForm } from "@/components/admin/ProductForm";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

export function EditProductForm({ productId }: { productId: string }) {
  const query = useQuery({
    queryKey: ["products", productId],
    queryFn: () => getProduct(productId),
    retry: 0,
  });

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-8 w-56" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-4">
        <Link href="/admin/products" className="text-sm font-medium text-primary hover:text-primary-hover">
          ← Back to products
        </Link>
        <ErrorState
          title="Couldn't load product"
          message={
            (query.error as { status?: number })?.status === 404
              ? "This product doesn't exist or is no longer available."
              : errorMessage(query.error)
          }
          onRetry={() => query.refetch()}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/products">Back to products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm font-medium text-primary hover:text-primary-hover">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Edit product</h1>
      </div>
      <ProductForm product={query.data.data} />
    </div>
  );
}