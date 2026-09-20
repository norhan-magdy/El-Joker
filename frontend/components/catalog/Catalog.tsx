"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { listProducts, listAllCategoriesFlattened, isApiError } from "@/lib/api";
import { ProductGrid, ProductGridSkeleton } from "@/components/catalog/ProductGrid";
import { SearchBar } from "@/components/catalog/SearchBar";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { ActiveFilters } from "@/components/catalog/ActiveFilters";
import { ProductFilters } from "@/components/catalog/ProductFilters";
import { FilterDrawer } from "@/components/catalog/FilterDrawer";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { useScrollToTopOnChange } from "@/lib/use-scroll-to-top";
import type { ProductSort } from "@/lib/types";

const SORTS: ProductSort[] = ["newest", "price-asc", "price-desc"];

interface CatalogProps {
  initialQ: string;
  initialCategories: string;
  initialMin: number | null;
  initialMax: number | null;
  initialSort: ProductSort;
  initialInStock: boolean;
  initialPage: number;
}

interface FilterState {
  q: string;
  categorySlugs: string[];
  min: number | null;
  max: number | null;
  sort: ProductSort;
  inStock: boolean;
}

export function Catalog({
  initialQ,
  initialCategories,
  initialMin,
  initialMax,
  initialSort,
  initialInStock,
  initialPage,
}: CatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [categorySlugs, setCategorySlugs] = useState<string[]>(() =>
    initialCategories.split(",").filter(Boolean),
  );
  const [min, setMin] = useState<number | null>(initialMin);
  const [max, setMax] = useState<number | null>(initialMax);
  const [sort, setSort] = useState<ProductSort>(initialSort);
  const [inStock, setInStock] = useState(initialInStock);
  const [page, setPage] = useState(initialPage);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useScrollToTopOnChange(page);

  const urlKey = searchParams.toString();
  const [prevUrlKey, setPrevUrlKey] = useState(urlKey);
  if (urlKey !== prevUrlKey) {
    const rawMin = searchParams.get("min");
    const rawMax = searchParams.get("max");
    const rawPage = searchParams.get("page");
    const rawSort = searchParams.get("sort");

    const nextMin = rawMin && Number.isFinite(Number(rawMin)) ? Number(rawMin) : null;
    const nextMax = rawMax && Number.isFinite(Number(rawMax)) ? Number(rawMax) : null;
    const nextPage =
      rawPage && Number.isFinite(Number(rawPage)) && Number(rawPage) >= 1
        ? Math.floor(Number(rawPage))
        : 1;
    const nextSort =
      rawSort && SORTS.includes(rawSort as ProductSort) ? (rawSort as ProductSort) : "newest";

    setPrevUrlKey(urlKey);
    setQ(searchParams.get("q") ?? "");
    setCategorySlugs((searchParams.get("categories") ?? "").split(",").filter(Boolean));
    setMin(nextMin);
    setMax(nextMax);
    setSort(nextSort);
    setInStock(searchParams.get("in_stock") === "1" || searchParams.get("in_stock") === "true");
    setPage(nextPage);
  }

  const syncUrl = (filters: FilterState & { page: number }) => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.categorySlugs.length > 0) sp.set("categories", filters.categorySlugs.join(","));
    if (filters.min !== null) sp.set("min", String(filters.min));
    if (filters.max !== null) sp.set("max", String(filters.max));
    if (filters.sort !== "newest") sp.set("sort", filters.sort);
    if (filters.inStock) sp.set("in_stock", "1");
    if (filters.page > 1) sp.set("page", String(filters.page));
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const applyFilters = (patch: Partial<FilterState>) => {
    const next: FilterState = {
      q: patch.q ?? q,
      categorySlugs: patch.categorySlugs ?? categorySlugs,
      min: patch.min !== undefined ? patch.min : min,
      max: patch.max !== undefined ? patch.max : max,
      sort: patch.sort ?? sort,
      inStock: patch.inStock ?? inStock,
    };
    setQ(next.q);
    setCategorySlugs(next.categorySlugs);
    setMin(next.min);
    setMax(next.max);
    setSort(next.sort);
    setInStock(next.inStock);
    setPage(1);
    syncUrl({ ...next, page: 1 });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    syncUrl({ q, categorySlugs, min, max, sort, inStock, page: nextPage });
  };

  const productsQuery = useQuery({
    queryKey: ["products", { page, q, categorySlugs, min, max, sort, inStock }],
    queryFn: () =>
      listProducts({
        page,
        q: q || undefined,
        categories: categorySlugs.length > 0 ? categorySlugs.join(",") : undefined,
        minPrice: min ?? undefined,
        maxPrice: max ?? undefined,
        sort,
        inStock,
      }),
    placeholderData: keepPreviousData,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => listAllCategoriesFlattened(),
  });

  const allCategories = categoriesQuery.data ?? [];
  const priceBounds = productsQuery.data?.price_range ?? null;
  const total = productsQuery.data?.meta.total;
  const products = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;
  const isLoading = productsQuery.isPending && !productsQuery.isPlaceholderData;
  const selectedCategoryObjects = allCategories.filter((c) => categorySlugs.includes(c.slug));

  const hasFilters =
    q !== "" || categorySlugs.length > 0 || min !== null || max !== null || inStock || sort !== "newest";

  const activeCount =
    (q ? 1 : 0) +
    categorySlugs.length +
    (min !== null || max !== null ? 1 : 0) +
    (inStock ? 1 : 0) +
    (sort !== "newest" ? 1 : 0);

  const clearFilters = () =>
    applyFilters({ q: "", categorySlugs: [], min: null, max: null, sort: "newest", inStock: false });

  const applyPrice = (next: { min: number | null; max: number | null }) => {
    const bounds = priceBounds;
    if (!bounds) return;
    const nextMin = next.min !== null && next.min > bounds.min ? next.min : null;
    const nextMax = next.max !== null && next.max < bounds.max ? next.max : null;
    applyFilters({ min: nextMin, max: nextMax });
  };

  const filterControls = {
    sort,
    onSortChange: (s: ProductSort) => applyFilters({ sort: s }),
    inStock,
    onInStockChange: (v: boolean) => applyFilters({ inStock: v }),
    priceBounds,
    min,
    max,
    onPriceChange: applyPrice,
    total,
    activeCount,
    onClearAll: clearFilters,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 xl:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-semibold leading-tight text-text-primary">Shop</h1>
        <p className="mt-1 text-sm text-text-muted">Browse the catalog</p>
      </div>

      <div className="mb-6 max-w-2xl">
        <SearchBar value={q} onValueChange={(v) => applyFilters({ q: v })} debounceMs={300} />
      </div>

      <div className="sticky top-16 z-20 mb-5 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0 lg:hidden">
        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setFiltersOpen(true)}>
          <svg
            aria-hidden
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
            />
          </svg>
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-on-primary">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            <CategoryFilter
              categories={allCategories}
              selected={categorySlugs}
              onToggle={(slug) =>
                applyFilters({
                  categorySlugs: categorySlugs.includes(slug)
                    ? categorySlugs.filter((s) => s !== slug)
                    : [...categorySlugs, slug],
                })
              }
              onToggleAll={() =>
                applyFilters({
                  categorySlugs: categorySlugs.length === allCategories.length ? [] : allCategories.map((c) => c.slug),
                })
              }
            />
            <div className="border-t border-border pt-6">
              <ProductFilters {...filterControls} />
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <ActiveFilters
            q={q}
            categories={selectedCategoryObjects}
            min={min}
            max={max}
            inStock={inStock}
            sort={sort}
            onRemoveQ={() => applyFilters({ q: "" })}
            onRemoveCategory={(slug) =>
              applyFilters({ categorySlugs: categorySlugs.filter((s) => s !== slug) })
            }
            onRemovePrice={() => applyFilters({ min: null, max: null })}
            onRemoveInStock={() => applyFilters({ inStock: false })}
            onRemoveSort={() => applyFilters({ sort: "newest" })}
            onClearAll={clearFilters}
          />

          {productsQuery.isError ? (
            <ErrorState
              message={
                isApiError(productsQuery.error)
                  ? productsQuery.error.message
                  : "Could not load products."
              }
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
                  onPageChange={handlePageChange}
                  hasPrev={page > 1}
                  hasNext={page < meta.last_page}
                  loading={productsQuery.isFetching}
                />
              ) : null}
            </>
          )}
        </div>
      </div>

      <FilterDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        categories={allCategories}
        selectedCategories={categorySlugs}
        onToggleCategory={(slug) =>
          applyFilters({
            categorySlugs: categorySlugs.includes(slug)
              ? categorySlugs.filter((s) => s !== slug)
              : [...categorySlugs, slug],
          })
        }
        onToggleAllCategories={() =>
          applyFilters({
            categorySlugs:
              categorySlugs.length === allCategories.length ? [] : allCategories.map((c) => c.slug),
          })
        }
        {...filterControls}
      />
    </div>
  );
}