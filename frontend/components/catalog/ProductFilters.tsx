"use client";

import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { PRODUCT_SORTS } from "@/lib/constants";
import { PriceRangeSlider, type PriceRangeValue } from "@/components/catalog/PriceRangeSlider";
import type { PriceRange, ProductSort } from "@/lib/types";

export interface ProductFiltersProps {
  sort: ProductSort;
  onSortChange: (sort: ProductSort) => void;
  inStock: boolean;
  onInStockChange: (value: boolean) => void;
  priceBounds: PriceRange | null;
  min: number | null;
  max: number | null;
  onPriceChange: (next: { min: number | null; max: number | null }) => void;
  total?: number;
  activeCount: number;
  onClearAll: () => void;
}

export function ProductFilters({
  sort,
  onSortChange,
  inStock,
  onInStockChange,
  priceBounds,
  min,
  max,
  onPriceChange,
  total,
  activeCount,
  onClearAll,
}: ProductFiltersProps) {
  const sliderBounds = priceBounds && priceBounds.max > priceBounds.min ? priceBounds : null;
  const sliderValue: PriceRangeValue = sliderBounds
    ? { min: min ?? sliderBounds.min, max: max ?? sliderBounds.max }
    : { min: 0, max: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
        {activeCount > 0 ? (
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={onClearAll}>
            Clear all
          </Button>
        ) : null}
      </div>

      <div>
        <Label htmlFor="product-sort">Sort by</Label>
        <Select
          id="product-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ProductSort)}
          className="mt-1.5"
        >
          {PRODUCT_SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Price range</Label>
        <div className="mt-3">
          {sliderBounds ? (
            <PriceRangeSlider bounds={sliderBounds} value={sliderValue} onChange={onPriceChange} />
          ) : (
            <p className="text-sm text-text-muted">Price range not available.</p>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Checkbox
          id="product-in-stock"
          checked={inStock}
          onChange={(e) => onInStockChange(e.target.checked)}
          label="In stock only"
        />
      </div>

      <p className="text-sm text-text-muted">
        {total !== undefined ? `${total} product${total === 1 ? "" : "s"}` : "\u00a0"}
      </p>
    </div>
  );
}