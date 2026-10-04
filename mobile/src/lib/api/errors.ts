/**
 * Typed API error contract.
 *
 * This mirrors `frontend/lib/api.ts` deliberately. The backend returns a
 * discriminated shape per failure mode and we must never collapse it into a
 * bare string — UI branches on `kind`, never on message text.
 *
 * See `backend/app/Exceptions/InsufficientStockException.php` for the 409.
 */

export type ValidationError = {
  kind: "validation";
  status: 422;
  message: string;
  errors: Record<string, string[]>;
};

export type StockConflictError = {
  kind: "stock";
  status: 409;
  message: string;
  product_id: string;
  requested: number;
  available: number;
};

export type BusinessError = {
  kind: "business";
  status: number;
  message: string;
  /** Populated for 429 so the UI can show a countdown. */
  retryAfterSeconds?: number;
};

export type ApiError = ValidationError | StockConflictError | BusinessError;

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    "message" in value
  );
}

export function isValidationError(value: unknown): value is ValidationError {
  return isApiError(value) && value.kind === "validation";
}

export function isStockConflict(value: unknown): value is StockConflictError {
  return isApiError(value) && value.kind === "stock";
}

/** Returns the remaining stock for a 409, or null for any other error. */
export function stockAvailable(err: unknown): number | null {
  return isStockConflict(err) ? err.available : null;
}

export function isRateLimited(err: unknown): err is BusinessError & {
  status: 429;
} {
  return isApiError(err) && err.status === 429;
}

export function isUnauthenticated(err: unknown): err is BusinessError & {
  status: 401;
} {
  return isApiError(err) && err.status === 401;
}

export function errorMessage(
  err: unknown,
  fallback = "Something went wrong."
): string {
  if (isApiError(err)) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Field-level messages for form display. Empty for non-validation errors. */
export function errorFieldErrors(
  err: unknown
): Record<string, string[]> {
  if (isValidationError(err)) return err.errors;
  return {};
}

export function firstFieldError(
  err: unknown,
  field: string
): string | undefined {
  return errorFieldErrors(err)[field]?.[0];
}