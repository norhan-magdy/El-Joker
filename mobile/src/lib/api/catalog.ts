import {
  ALL_CATEGORIES_MAX_PAGES,
  PAGE_SIZE_CATEGORIES,
  type AuthScope,
} from "@/lib/config";
import type {
  Category,
  CategoryInput,
  ListProductsParams,
  MessageResponse,
  Paginated,
  Product,
  ProductInput,
  ProductsPage,
} from "@/lib/types";
import { api } from "./client";

/**
 * Catalogue reads.
 *
 * Both `index` and `show` decide whether to include inactive products from
 * `$request->user()?->hasPermissionTo('products.manage')`. A `public` scope
 * sends no `Authorization` header, so `$request->user()` is null and the check
 * is false — which means a *public* read 404s on an inactive product and hides
 * it from the list. Admin screens must therefore pass `scope: "admin"` or they
 * cannot see or open the very products they are meant to edit.
 */
export function listProducts(
  params: ListProductsParams = {},
  scope: AuthScope = "public"
): Promise<ProductsPage> {
  return api.get<ProductsPage>("products", {
    scope,
    params: {
      page: params.page,
      q: params.q,
      categories: params.categories,
      min: params.minPrice,
      max: params.maxPrice,
      sort: params.sort,
      in_stock: params.inStock ? "1" : undefined,
    },
  });
}

export function getProduct(
  id: string,
  scope: AuthScope = "public"
): Promise<{ data: Product }> {
  return api.get<{ data: Product }>(`products/${id}`, { scope });
}

export function listCategories(
  page = 1
): Promise<Paginated<Category>> {
  return api.get<Paginated<Category>>("categories", {
    scope: "public",
    params: { page },
  });
}

export function getCategory(id: number): Promise<{ data: Category }> {
  return api.get<{ data: Category }>(`categories/${id}`, { scope: "public" });
}

/**
 * The backend caps categories at 20 per page and exposes no `per_page`
 * override, so the full tree has to be walked page by page.
 */
export async function listAllCategoriesFlattened(
  opts: { maxPages?: number } = {}
): Promise<Category[]> {
  const maxPages = opts.maxPages ?? ALL_CATEGORIES_MAX_PAGES;
  const all: Category[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const res = await listCategories(page);
    all.push(...res.data);
    if (
      res.meta.current_page >= res.meta.last_page ||
      res.data.length === 0
    ) {
      break;
    }
  }

  return all;
}

export function createProduct(
  body: ProductInput
): Promise<{ data: Product }> {
  return api.post<{ data: Product }>("products", body, { scope: "admin" });
}

export function updateProduct(
  id: string,
  body: Partial<ProductInput>
): Promise<{ data: Product }> {
  return api.put<{ data: Product }>(`products/${id}`, body, { scope: "admin" });
}

export function deleteProduct(id: string): Promise<MessageResponse> {
  return api.delete<MessageResponse>(`products/${id}`, { scope: "admin" });
}

export function createCategory(
  body: CategoryInput
): Promise<{ data: Category }> {
  return api.post<{ data: Category }>("categories", body, { scope: "admin" });
}

export function updateCategory(
  id: number,
  body: Partial<CategoryInput>
): Promise<{ data: Category }> {
  return api.put<{ data: Category }>(`categories/${id}`, body, {
    scope: "admin",
  });
}

export function deleteCategory(id: number): Promise<MessageResponse> {
  return api.delete<MessageResponse>(`categories/${id}`, { scope: "admin" });
}

export { PAGE_SIZE_CATEGORIES };