import { API_URL, type AuthScope } from "@/lib/config";
import { ApiError } from "./errors";

type QueryValue = string | number | boolean | undefined | null;

/**
 * In-memory token mirror.
 *
 * SecureStore reads are async, but the transport needs the token
 * synchronously on every call. The cache is hydrated once during boot (see
 * `hydrateTokenCache`) and kept in sync by the auth store, so SecureStore is
 * only ever the durable backing store, never the hot path.
 */
const tokenCache: Record<Exclude<AuthScope, "public">, string | null> = {
  customer: null,
  admin: null,
};

export function setCachedToken(
  scope: Exclude<AuthScope, "public">,
  token: string | null
): void {
  tokenCache[scope] = token;
}

export function getCachedToken(
  scope: Exclude<AuthScope, "public">
): string | null {
  return tokenCache[scope];
}

export function clearTokenCache(): void {
  tokenCache.customer = null;
  tokenCache.admin = null;
}

type UnauthorizedHandler = (scope: Exclude<AuthScope, "public">) => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * Registered once by the auth store. Kept as a callback rather than a direct
 * import to avoid a cycle between the transport and the store.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

export function buildUrl(
  path: string,
  params?: Record<string, QueryValue>
): string {
  const url = new URL(
    `${API_URL}${path.startsWith("/") ? path : `/${path}`}`
  );
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const asDate = Date.parse(header);
  if (Number.isNaN(asDate)) return undefined;
  return Math.max(0, Math.round((asDate - Date.now()) / 1000));
}

/**
 * Normalises a non-2xx response into the typed `ApiError` union.
 *
 * Order matters: 401 before 403 before 422 before 409, because the stock
 * conflict is itself a 409 and must not be swallowed by the business catch-all.
 */
function toApiError(status: number, payload: unknown, retryAfter?: number): ApiError {
  const message =
    (payload as { message?: string } | null)?.message ??
    `Request failed (${status}).`;

  if (status === 401) {
    return { kind: "business", status, message };
  }
  if (status === 403) {
    return { kind: "business", status, message };
  }
  if (
    status === 422 &&
    payload &&
    typeof payload === "object" &&
    "errors" in payload
  ) {
    return {
      kind: "validation",
      status,
      message,
      errors: (payload as { errors: Record<string, string[]> }).errors,
    };
  }
  if (
    status === 409 &&
    payload &&
    typeof payload === "object" &&
    (payload as { code?: string }).code === "insufficient_stock"
  ) {
    const stock = payload as {
      product_id?: string;
      requested?: number;
      available?: number;
    };
    return {
      kind: "stock",
      status,
      message,
      product_id: stock.product_id ?? "",
      requested: stock.requested ?? 0,
      available: stock.available ?? 0,
    };
  }
  if (status === 429) {
    return { kind: "business", status, message, retryAfterSeconds: retryAfter };
  }
  return { kind: "business", status, message };
}

async function readPayload(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, QueryValue>;
  scope?: AuthScope;
  body?: unknown;
  /** Overrides the default request timeout for long-running calls. */
  timeoutMs?: number;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, scope = "public", body, headers, signal, timeoutMs } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (scope !== "public") {
    const token = getCachedToken(scope);
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? 15_000);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener("abort", forwardAbort);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      method: options.method ?? (body !== undefined ? "POST" : "GET"),
      headers: requestHeaders,
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    const aborted =
      err instanceof Error && err.name === "AbortError";
    throw {
      kind: "business",
      status: 0,
      message: aborted
        ? "The request timed out. Check your connection and try again."
        : "Network error. Could not reach the server.",
    } satisfies ApiError;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }

  const payload = await readPayload(res);

  if (!res.ok) {
    const error = toApiError(
      res.status,
      payload,
      parseRetryAfter(res.headers.get("Retry-After"))
    );
    if (error.status === 401 && scope !== "public") {
      onUnauthorized?.(scope);
    }
    throw error;
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};