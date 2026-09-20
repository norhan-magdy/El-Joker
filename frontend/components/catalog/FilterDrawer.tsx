"use client";

import { Drawer } from "@/components/shell/Drawer";
import { ProductFilters, type ProductFiltersProps } from "@/components/catalog/ProductFilters";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import type { Category } from "@/lib/types";

interface FilterDrawerProps extends ProductFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (slug: string) => void;
  onToggleAllCategories: () => void;
}

export function FilterDrawer({
  open,
  onOpenChange,
  categories,
  selectedCategories,
  onToggleCategory,
  onToggleAllCategories,
  ...filters
}: FilterDrawerProps) {
  return (
    <Drawer open={open} onClose={() => onOpenChange(false)} side="left" title="Filters">
      <div className="space-y-6">
        <ProductFilters {...filters} />
        <div className="border-t border-border pt-6">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Categories</h3>
          <CategoryFilter
            categories={categories}
            selected={selectedCategories}
            onToggle={onToggleCategory}
            onToggleAll={onToggleAllCategories}
          />
        </div>
      </div>
    </Drawer>
  );
}