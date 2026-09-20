import { API_URL, ALL_CATEGORIES_MAX_PAGES } from "@/lib/constants";
import type {
  AuthResponse,
  CartItem,
  Category,
  CategoryInput,
  Invoice,
  MessageResponse,
  Order,
  OrderStatus,
  PaidPayment,
  Paginated,
  Product,
  ProductInput,
  Role,
  RolesPayload,
  User,
} from "@/lib/types";
import { useAuthStore, getToken } from "@/store/auth";
import { deleteAuthCookie } from "@/lib/auth-cookie";
import { getQueryClient } from "@/lib/query-client";

export type ApiError =
  | {
      kind: "validation";
      status: 422;
      message: string;
      errors: Record<string, string[]>;
    }
  | { kind: "business"; status: number; message: string };

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "kind" in err &&
    ((err as ApiError).kind === "validation" ||
      (err as ApiError).kind === "business")
  );
}

export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (typeof err === "object" && err !== null) {
    const e = err as Partial<ApiError>;
    if (typeof e.message === "string") return e.message;
  }
  return fallback;
}

export function errorFieldErrors(err: unknown): Record<string, string[]> {
  if (isApiError(err) && err.kind === "validation") return err.errors;
  return {};
}

function redirectToLogin(next?: string) {
  if (typeof window === "undefined") return;
  const login = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  if (window.location.pathname.startsWith("/login")) return;
  window.location.href = login;
}

function handleUnauthorized() {
  useAuthStore.getState().clearSession();
  deleteAuthCookie();
  const qc = getQueryClient();
  qc.clear();
  redirectToLogin();
}

function handleForbidden() {
  const qc = getQueryClient();
  void qc.invalidateQueries({ queryKey: ["auth", "me"] });
}

function buildUrl(path: string, params?: Record<string, string | number | undefined | null>): string {
  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    params?: Record<string, string | number | undefined | null>;
  } = {},
): Promise<T> {
  const { method = "GET", body, params } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw {
      kind: "business",
      status: 0,
      message: "Network error. Could not reach the server.",
    } satisfies ApiError;
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const msg = (payload as { message?: string } | null)?.message ?? `Request failed (${res.status}).`;
    if (res.status === 401) {
      handleUnauthorized();
      throw {
        kind: "business",
        status: 401,
        message: msg,
      } satisfies ApiError;
    }
    if (res.status === 403) {
      handleForbidden();
      throw {
        kind: "business",
        status: 403,
        message: msg,
      } satisfies ApiError;
    }
    if (res.status === 422 && payload && typeof payload === "object" && "errors" in payload) {
      throw {
        kind: "validation",
        status: 422,
        message: msg,
        errors: (payload as { errors: Record<string, string[]> }).errors,
      } satisfies ApiError;
    }
    throw { kind: "business", status: res.status, message: msg } satisfies ApiError;
  }

  return payload as T;
}

// ---------------------------------------------------------------- auth

export function registerApi(body: { name: string; email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>("auth/register", { method: "POST", body });
}

export function loginApi(body: { email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>("auth/login", { method: "POST", body });
}

export function adminLoginApi(body: { email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>("admin/login", { method: "POST", body });
}

export function logoutApi(): Promise<MessageResponse> {
  return request<MessageResponse>("auth/logout", { method: "POST" });
}

export function getMe(): Promise<{ data: User }> {
  return request<{ data: User }>("auth/me");
}

// ---------------------------------------------------------------- products

export interface ListProductsParams {
  page?: number;
  q?: string;
  category?: string;
}

export function listProducts(params: ListProductsParams = {}): Promise<Paginated<Product>> {
  return request<Paginated<Product>>("products", { params: { page: params.page, q: params.q, category: params.category } });
}

export function getProduct(id: string): Promise<{ data: Product }> {
  return request<{ data: Product }>(`products/${id}`);
}

export function createProduct(body: ProductInput): Promise<{ data: Product }> {
  return request<{ data: Product }>("products", { method: "POST", body });
}

export function updateProduct(id: string, body: Partial<ProductInput>): Promise<{ data: Product }> {
  return request<{ data: Product }>(`products/${id}`, { method: "PUT", body });
}

export function deleteProduct(id: string): Promise<MessageResponse> {
  return request<MessageResponse>(`products/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------- categories

export function listCategories(page = 1): Promise<Paginated<Category>> {
  return request<Paginated<Category>>("categories", { params: { page } });
}

export function getCategory(id: number): Promise<{ data: Category }> {
  return request<{ data: Category }>(`categories/${id}`);
}

export function createCategory(body: CategoryInput): Promise<{ data: Category }> {
  return request<{ data: Category }>("categories", { method: "POST", body });
}

export function updateCategory(id: number, body: Partial<CategoryInput>): Promise<{ data: Category }> {
  return request<{ data: Category }>(`categories/${id}`, { method: "PUT", body });
}

export function deleteCategory(id: number): Promise<MessageResponse> {
  return request<MessageResponse>(`categories/${id}`, { method: "DELETE" });
}

/**
 * Collect every category across all pages (backend caps at 20/page with no
 * per_page override), used only for form selects needing the full set.
 */
export async function listAllCategoriesFlattened(opts: { maxPages?: number } = {}): Promise<Category[]> {
  const maxPages = opts.maxPages ?? ALL_CATEGORIES_MAX_PAGES;
  const all: Category[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await listCategories(page);
    all.push(...res.data);
    if (res.meta.current_page >= res.meta.last_page || res.data.length === 0) break;
  }
  return all;
}

// ---------------------------------------------------------------- cart

export function listCartItems(): Promise<{ data: CartItem[] }> {
  return request<{ data: CartItem[] }>("cart/items");
}

export function addCartItem(body: { product_id: string; quantity?: number }): Promise<{ data: CartItem }> {
  return request<{ data: CartItem }>("cart/items", { method: "POST", body });
}

export function updateCartItem(id: string, body: { quantity: number }): Promise<{ data: CartItem }> {
  return request<{ data: CartItem }>(`cart/items/${id}`, { method: "PUT", body });
}

export function removeCartItem(id: string): Promise<MessageResponse> {
  return request<MessageResponse>(`cart/items/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------- favorites

export function listFavorites(): Promise<{ data: Product[] }> {
  return request<{ data: Product[] }>("favorites");
}

export function addFavorite(product_id: string): Promise<MessageResponse> {
  return request<MessageResponse>("favorites", { method: "POST", body: { product_id } });
}

export function removeFavorite(product_id: string): Promise<MessageResponse> {
  return request<MessageResponse>(`favorites/${product_id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------- invoices (admin)

export function listAdminInvoices(params: { page?: number; q?: string } = {}): Promise<Paginated<Invoice>> {
  return request<Paginated<Invoice>>("admin/invoices", { params: { page: params.page, q: params.q } });
}

export function getAdminInvoice(id: string): Promise<{ data: Invoice }> {
  return request<{ data: Invoice }>(`admin/invoices/${id}`);
}

export function regenerateAdminInvoice(id: string): Promise<{ message: string; data: Invoice }> {
  return request<{ message: string; data: Invoice }>(`admin/invoices/${id}/generate`, { method: "POST" });
}

// ---------------------------------------------------------------- orders

export function listOrders(page = 1): Promise<Paginated<Order>> {
  return request<Paginated<Order>>("orders", { params: { page } });
}

export function getOrder(id: string): Promise<{ data: Order }> {
  return request<{ data: Order }>(`orders/${id}`);
}

export function checkout(body: { shipping_address: string }): Promise<{ data: Order }> {
  return request<{ data: Order }>("orders/checkout", { method: "POST", body });
}

export function updateOrderStatus(id: string, body: { status: OrderStatus }): Promise<{ data: Order }> {
  return request<{ data: Order }>(`orders/${id}`, { method: "PUT", body });
}

export function payOrder(
  id: string,
  body: { provider: string; transaction_id?: string },
): Promise<{ message: string; payment: PaidPayment }> {
  return request<{ message: string; payment: PaidPayment }>(`orders/${id}/pay`, { method: "POST", body });
}

export async function downloadInvoicePdf(orderId: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(`orders/${orderId}/invoice/pdf`), { headers });
  } catch {
    throw {
      kind: "business",
      status: 0,
      message: "Network error. Could not reach the server.",
    } satisfies ApiError;
  }

  if (!res.ok) {
    const text = await res.text();
    let payload: { message?: string } | null = null;
    try {
      payload = text ? (JSON.parse(text) as { message?: string }) : null;
    } catch {
      payload = null;
    }
    const msg = payload?.message ?? `Request failed (${res.status}).`;

    if (res.status === 401) {
      handleUnauthorized();
      throw { kind: "business", status: 401, message: msg } satisfies ApiError;
    }
    if (res.status === 403) {
      handleForbidden();
      throw { kind: "business", status: 403, message: msg } satisfies ApiError;
    }
    throw { kind: "business", status: res.status, message: msg } satisfies ApiError;
  }

  return res.blob();
}

// ---------------------------------------------------------------- rbac

export function listRoles(): Promise<RolesPayload> {
  return request<RolesPayload>("rbac/roles");
}

export function createRole(body: { name: string }): Promise<{ data: { id: number; name: string } }> {
  return request<{ data: { id: number; name: string } }>("rbac/roles", { method: "POST", body });
}

export function deleteRole(id: number): Promise<MessageResponse> {
  return request<MessageResponse>(`rbac/roles/${id}`, { method: "DELETE" });
}

export function givePermissions(id: number, body: { permissions: string[] }): Promise<MessageResponse> {
  return request<MessageResponse>(`rbac/roles/${id}/permissions`, { method: "POST", body });
}

export function revokePermissions(id: number, body: { permissions: string[] }): Promise<MessageResponse> {
  return request<MessageResponse>(`rbac/roles/${id}/permissions`, { method: "DELETE", body });
}

export function syncUserRoles(userId: string, body: { roles: string[] }): Promise<{ data: Role[] }> {
  return request<{ data: Role[] }>(`rbac/users/${userId}/roles`, { method: "PUT", body });
}