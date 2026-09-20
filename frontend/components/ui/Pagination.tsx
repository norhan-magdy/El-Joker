"use client";

import { Button } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
  loading?: boolean;
}

function pageNumbers(page: number, lastPage: number): (number | "...")[] {
  if (lastPage <= 7) {
    return Array.from({ length: Math.max(lastPage, 0) }, (_, i) => i + 1);
  }
  const current = Math.min(Math.max(page, 1), lastPage);
  const pages = new Set<number | "...">([1, lastPage, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p): p is number => typeof p === "number" && p >= 1 && p <= lastPage)
    .sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  let prev: number | null = null;
  for (const p of sorted) {
    if (prev !== null && p - (prev as number) > 1) result.push("...");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({ page, lastPage, onPageChange, hasPrev, hasNext, loading = false }: PaginationProps) {
  if (lastPage <= 1) return null;

  const current = Math.min(Math.max(page, 1), lastPage);

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <Button
        variant="ghost"
        icon
        disabled={!hasPrev}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className="h-9 w-9"
      >
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
            clipRule="evenodd"
          />
        </svg>
      </Button>

      {pageNumbers(page, lastPage).map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-sm text-text-muted">
            {`\u2026`}
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === current ? "page" : undefined}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
              p === current
                ? "bg-primary text-on-primary"
                : "text-text-secondary hover:bg-overlay hover:text-text-primary"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <Button
        variant="ghost"
        icon
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className="h-9 w-9"
      >
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
      </Button>

      {loading ? (
        <span
          aria-hidden
          className="ml-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-text-muted/30 border-t-primary"
        />
      ) : null}
    </nav>
  );
}