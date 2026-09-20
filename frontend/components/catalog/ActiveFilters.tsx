"use client";

import { Button } from "@/components/ui/Button";
import type { Category, ProductSort } from "@/lib/types";
import { PRODUCT_SORTS, formatMoney } from "@/lib/constants";

interface ActiveFiltersProps {
  q?: string;
  categories: Category[];
  min: number | null;
  max: number | null;
  inStock: boolean;
  sort: ProductSort;
  onRemoveQ: () => void;
  onRemoveCategory: (slug: string) => void;
  onRemovePrice: () => void;
  onRemoveInStock: () => void;
  onRemoveSort: () => void;
  onClearAll: () => void;
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface py-0.5 pl-2.5 pr-1 text-xs font-medium text-text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-overlay hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <svg aria-hidden className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </span>
  );
}

export function ActiveFilters({
  q,
  categories,
  min,
  max,
  inStock,
  sort,
  onRemoveQ,
  onRemoveCategory,
  onRemovePrice,
  onRemoveInStock,
  onRemoveSort,
  onClearAll,
}: ActiveFiltersProps) {
  let priceLabel = "";
  if (min !== null && max !== null) {
    priceLabel = `${formatMoney(min)} – ${formatMoney(max)}`;
  } else if (min !== null) {
    priceLabel = `From ${formatMoney(min)}`;
  } else if (max !== null) {
    priceLabel = `Up to ${formatMoney(max)}`;
  }

  const sortLabel = PRODUCT_SORTS.find((s) => s.value === sort)?.label ?? "";

  const hasAny =
    !!q ||
    categories.length > 0 ||
    min !== null ||
    max !== null ||
    inStock ||
    sort !== "newest";

  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {q ? <ActiveChip label={`Search: “${q}”`} onRemove={onRemoveQ} /> : null}
      {categories.map((c) => (
        <ActiveChip key={c.slug} label={c.name} onRemove={() => onRemoveCategory(c.slug)} />
      ))}
      {priceLabel ? <ActiveChip label={priceLabel} onRemove={onRemovePrice} /> : null}
      {inStock ? <ActiveChip label="In stock only" onRemove={onRemoveInStock} /> : null}
      {sort !== "newest" ? <ActiveChip label={sortLabel} onRemove={onRemoveSort} /> : null}
      <Button variant="ghost" className="h-7 px-2 text-xs" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}