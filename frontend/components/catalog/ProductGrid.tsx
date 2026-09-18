import { ProductCard } from "@/components/catalog/ProductCard";
import type { Product } from "@/lib/types";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="aspect-square bg-border/60" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-border/70" />
            <div className="h-4 w-2/3 rounded bg-border/70" />
            <div className="h-4 w-1/4 rounded bg-border/70" />
            <div className="h-10 rounded-md bg-border/60" />
          </div>
        </li>
      ))}
    </ul>
  );
}