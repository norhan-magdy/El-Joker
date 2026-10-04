import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { errorFieldErrors } from "@/lib/api/errors";

/**
 * Pushes the API's 422 field errors onto a react-hook-form instance.
 *
 * Laravel's field names are the source of truth, so the mapping is a direct
 * lookup rather than a message match. Fields the server rejected that the form
 * does not know about are ignored here — a login's "Invalid credentials." has
 * no `errors` object at all and belongs in a banner, not on an input.
 */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown
): boolean {
  const fields = errorFieldErrors(error);
  const names = Object.keys(fields);
  if (names.length === 0) return false;

  for (const name of names) {
    const message = fields[name]?.[0];
    if (!message) continue;
    setError(name as Path<T>, { type: "server", message });
  }

  return true;
}

/**
 * The server rejected the request but attached no field-level detail, so the
 * reason has to be shown as a banner instead of being attached to an input.
 */
export function hasUnmappedServerError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 422 &&
    Object.keys(errorFieldErrors(error)).length === 0
  );
}
