import { useInfiniteQuery } from "@tanstack/react-query";

import { listProducts } from "@/lib/api/catalog";
import { queryKeys } from "@/lib/query-keys";
import type { ListProductsParams, Product } from "@/lib/types";

/**
 * Paged product feed.
 *
 * The API paginates server-side and returns `meta.last_page`, so `getNextPageParam`
 * stops on the server's own page count instead of guessing with a fixed page size
 * that would break the moment a product is added or removed.
 */
export function useProducts(params: ListProductsParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.catalog.products({
      page: undefined,
      categorySlugs: params.categories,
      search: params.q,
      sort: params.sort,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      inStock: params.inStock,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listProducts({ ...params, page: pageParam as number }),
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page
        ? last.meta.current_page + 1
        : undefined,
  });
}

/** Flattens the pages into the single array a list renders. */
export function flattenProducts(
  pages: { data: Product[] }[] | undefined
): Product[] {
  if (!pages) return [];
  return pages.flatMap((page) => page.data);
}
