"use client";

import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Price } from "@/components/ui/Price";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import type { Product } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = typeof product.stock === "number" && product.stock === 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden rounded-t-lg"
        aria-label={product.title}
      >
        <ImageWithFallback
          src={product.image_url}
          alt={product.title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="rounded-t-lg transition-transform duration-150 ease-out group-hover:scale-[1.03]"
        />
        {outOfStock ? (
          <Badge variant="neutral" className="absolute left-3 top-3 bg-surface/95 shadow-sm">
            Out of stock
          </Badge>
        ) : null}
      </Link>
      <div className="absolute right-2 top-2">
        <FavoriteButton productId={product.id} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category ? (
          <p className="text-xs uppercase tracking-wide text-text-muted">{product.category.name}</p>
        ) : null}
        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 text-sm font-medium leading-5 text-text-primary hover:text-primary"
        >
          {product.title}
        </Link>
        <div className="mt-auto grid gap-3 pt-1">
          <Price value={product.price} className="text-base font-semibold text-text-primary" />
          <AddToCartButton product={product} fullWidth />
        </div>
      </div>
    </div>
  );
}