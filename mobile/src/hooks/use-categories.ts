import { useQuery } from "@tanstack/react-query";

import { listAllCategoriesFlattened, listCategories } from "@/lib/api/catalog";
import { queryKeys } from "@/lib/query-keys";
import type { Category } from "@/lib/types";

/**
 * Categories for filter chips.
 *
 * The home screen only shows the first page's worth; the search screen and the
 * admin category manager use the flattened tree, because the API caps pages at
 * 20 and a partial list would silently hide categories.
 */
export function useCategoriesFlat() {
  return useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => listCategories(1),
    select: (page) => page.data,
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: [...queryKeys.catalog.categories, "all"],
    queryFn: () => listAllCategoriesFlattened(),
    staleTime: 5 * 60_000,
  });
}

/**
 * Presents the tree as a flat, labelled list with an indent derived from
 * `parent_id`. The API returns categories unordered by depth, so the hierarchy
 * is rebuilt here rather than assumed.
 */
export function buildCategoryTree(categories: Category[]) {
  const byParent = new Map<number | null, Category[]>();
  for (const category of categories) {
    const key = category.parent_id;
    const siblings = byParent.get(key) ?? [];
    siblings.push(category);
    byParent.set(key, siblings);
  }

  const out: { category: Category; depth: number }[] = [];

  const walk = (parentId: number | null, depth: number) => {
    const siblings = byParent.get(parentId) ?? [];
    for (const category of siblings) {
      out.push({ category, depth });
      walk(category.id, depth + 1);
    }
  };

  walk(null, 0);

  // Categories whose parent is not in the response would otherwise vanish.
  const seen = new Set(out.map((entry) => entry.category.id));
  for (const category of categories) {
    if (!seen.has(category.id)) out.push({ category, depth: 0 });
  }

  return out;
}
