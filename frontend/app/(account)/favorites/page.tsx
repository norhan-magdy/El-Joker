"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listFavorites, errorMessage } from "@/lib/api";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

export default function FavoritesPage() {
  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: listFavorites,
  });

  if (query.isPending) {
    return (
      <div className="space-y-8" aria-busy="true">
        <Skeleton className="h-9 w-48" />
        <ProductGridSkeleton />
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState title="Couldn't load favorites" message={errorMessage(query.error)} onRetry={() => query.refetch()} />;
  }

  const products = query.data.data;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold leading-tight text-text-primary">Favorites</h1>

      {products.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          caption="Tap the heart on any product to save it for later."
          action={
            <Button asChild>
              <Link href="/shop">Browse products</Link>
            </Button>
          }
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}