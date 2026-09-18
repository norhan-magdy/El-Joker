import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalog } from "@/components/catalog/Catalog";
import { ProductGridSkeleton } from "@/components/catalog/ProductGrid";

export const metadata: Metadata = {
  title: "Shop",
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 xl:px-8">
          <ProductGridSkeleton />
        </div>
      }
    >
      <Catalog
        key={`${params.q ?? ""}|${params.category ?? ""}`}
        initialQ={params.q ?? ""}
        initialCategory={params.category ?? null}
      />
    </Suspense>
  );
}