import { QueryClient } from "@tanstack/react-query";

import { ApiError, isApiError } from "@/lib/api/errors";

/**
 * Retry policy.
 *
 * Retrying a rejected mutation is safe — the server is the source of truth and
 * stock conflicts resolve by refetching, not by replaying the write.
 * Retrying a 429 is pointless because the limiter is keyed per minute/hour.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status === 0) return failureCount < 2;
  if (isApiError(error) && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: shouldRetry,
      },
    },
  });
}

/**
 * Widens the default `Error` type so `useQuery`'s `error` is the typed union
 * rather than an opaque `Error`.
 */
export function asApiError(error: unknown): ApiError | null {
  return isApiError(error) ? error : null;
}