import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalog } from "@/components/catalog/Catalog";
import { ProductGridSkeleton } from "@/components/catalog/ProductGrid";
import type { ProductSort } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop",
};

const SORTS: ProductSort[] = ["newest", "price-asc", "price-desc"];

function parseNumber(raw: string | string[] | undefined): number | null {
  if (Array.isArray(raw)) raw = raw[0];
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function parsePage(raw: string | string[] | undefined): number {
  const value = parseNumber(raw);
  if (value === null) return 1;
  const page = Math.floor(value);
  return page >= 1 ? page : 1;
}

interface ShopSearchParams {
  q?: string;
  categories?: string;
  min?: string;
  max?: string;
  sort?: string;
  in_stock?: string;
  page?: string;
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const categories = typeof params.categories === "string" ? params.categories : "";
  const min = parseNumber(params.min);
  const max = parseNumber(params.max);
  const sort: ProductSort =
    typeof params.sort === "string" && SORTS.includes(params.sort as ProductSort)
      ? (params.sort as ProductSort)
      : "newest";
  const inStock = params.in_stock === "1" || params.in_stock === "true";
  const page = parsePage(params.page);

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 xl:px-8">
          <ProductGridSkeleton />
        </div>
      }
    >
      <Catalog
        initialQ={q}
        initialCategories={categories}
        initialMin={min}
        initialMax={max}
        initialSort={sort}
        initialInStock={inStock}
        initialPage={page}
      />
    </Suspense>
  );
}