"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { listCategories, listProducts, isApiError } from "@/lib/api";
import { ProductGrid, ProductGridSkeleton } from "@/components/catalog/ProductGrid";
import { SearchBar } from "@/components/catalog/SearchBar";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";

interface CatalogProps {
  initialQ: string;
  initialCategory: string | null;
}

export function Catalog({ initialQ, initialCategory }: CatalogProps) {
  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [page, setPage] = useState(1);
  const [prevFilterKey, setPrevFilterKey] = useState("");

  const filterKey = `${q}|${category ?? ""}`;
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const productsQuery = useQuery({
    queryKey: ["products", page, q, category ?? ""],
    queryFn: () => listProducts({ page, q, category: category ?? undefined }),
    placeholderData: keepPreviousData,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", 1],
    queryFn: () => listCategories(1),
  });

  const products = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;
  const isLoading = productsQuery.isPending && !productsQuery.isPlaceholderData;
  const categories = categoriesQuery.data?.data ?? [];
  const hasFilters = q !== "" || category !== null;

  const clearFilters = () => {
    setQ("");
    setCategory(null);
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 xl:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-semibold leading-tight text-text-primary">Shop</h1>
        <p className="mt-1 text-sm text-text-muted">Browse the catalog</p>
      </div>

      <div className="mb-6 max-w-2xl">
        <SearchBar value={q} onValueChange={(v) => setQ(v)} debounceMs={300} />
      </div>

      <div className="mb-8 overflow-x-auto pb-1">
        <CategoryFilter
          categories={categories}
          selected={category}
          onSelect={(slug) => setCategory(slug)}
        />
      </div>

      {productsQuery.isError ? (
        <ErrorState
          message={isApiError(productsQuery.error) ? productsQuery.error.message : "Could not load products."}
          onRetry={() => void productsQuery.refetch()}
        />
      ) : isLoading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No products found" : "No products yet"}
          caption={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Products will appear here once the catalog is populated."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear search/filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div
            aria-busy={productsQuery.isFetching}
            className={productsQuery.isFetching ? "opacity-60 transition-opacity" : ""}
          >
            <ProductGrid products={products} />
          </div>
          {meta && meta.last_page > 1 ? (
            <Pagination
              page={page}
              lastPage={meta.last_page}
              onPageChange={setPage}
              hasPrev={page > 1}
              hasNext={page < meta.last_page}
              loading={productsQuery.isFetching}
            />
          ) : null}
        </>
      )}

      </div>
  );
}