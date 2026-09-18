"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getProduct, errorMessage } from "@/lib/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";

export function ProductDetail({ productId }: { productId: string }) {
  const query = useQuery({
    queryKey: ["products", productId],
    queryFn: () => getProduct(productId),
    retry: 0,
  });

  let content: ReactNode;

  if (query.isPending) {
    content = (
      <div className="grid gap-8 lg:grid-cols-2" aria-busy="true">
        <div className="mx-auto w-full max-w-md">
          <Skeleton className="aspect-square w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  } else if (query.isError) {
    content = (
      <ErrorState
        title="Product unavailable"
        message={
          (query.error as { status?: number })?.status === 404
            ? "This product doesn't exist or is no longer available."
            : errorMessage(query.error)
        }
        onRetry={() => query.refetch()}
        action={
          <Button asChild variant="secondary">
            <Link href="/">Browse catalog</Link>
          </Button>
        }
      />
    );
  } else {
    const product = query.data.data;
    const isOutOfStock = typeof product.stock === "number" && product.stock === 0;

    content = (
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-primary">
                Home
              </Link>
            </li>
            {product.category && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/?category=${product.category.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="line-clamp-1 max-w-[16rem]" aria-current="page">
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-md">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-background">
              <ImageWithFallback src={product.image_url} alt={product.title} sizes="(min-width: 1024px) 28rem, 100vw" priority />
            </div>
          </div>

          <div className="space-y-5">
            {product.category ? (
              <Link
                href={`/?category=${product.category.slug}`}
                className="inline-flex"
              >
                <Badge variant="neutral">{product.category.name}</Badge>
              </Link>
            ) : null}
            <h1 className="text-3xl font-semibold leading-tight text-text-primary [text-wrap:balance]">
              {product.title}
            </h1>

            <Price value={product.price} className="block text-3xl font-semibold text-text-primary" />

            <p className="text-sm leading-6 text-text-secondary">
              {isOutOfStock ? (
                <span className="font-medium text-error">Out of stock</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  In stock
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-56">
                <AddToCartButton product={product} fullWidth />
              </div>
              <FavoriteButton productId={product.id} variant="pill" />
            </div>

            {product.description ? (
              <div className="border-t border-border pt-5">
                <h2 className="text-base font-semibold text-text-primary">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-text-secondary">
                  {product.description}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 xl:px-8">
      {content}
    </div>
  );
}