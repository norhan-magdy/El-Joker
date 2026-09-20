"use client";

import { useEffect, useRef } from "react";
import type { Category } from "@/lib/types";
import { Checkbox } from "@/components/ui/Checkbox";

interface CategoryFilterProps {
  categories: Category[];
  selected: string[];
  onToggle: (slug: string) => void;
  onToggleAll: () => void;
}

interface CategoryRowProps {
  category: Category;
  depth: number;
  selected: string[];
  onToggle: (slug: string) => void;
  indeterminate?: boolean;
}

function CategoryRow({ category, depth, selected, onToggle, indeterminate = false }: CategoryRowProps) {
  const ref = useRef<HTMLInputElement>(null);
  const checked = selected.includes(category.slug);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <div className="flex items-center gap-2 py-0.5" style={{ paddingLeft: depth * 20 }}>
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
        <Checkbox
          ref={ref}
          checked={checked}
          onChange={() => onToggle(category.slug)}
          className="hover:border-text-muted"
        />
        <span className="truncate text-sm text-text-primary">{category.name}</span>
      </label>
      {category.products_count > 0 ? (
        <span className="shrink-0 text-xs tabular-nums text-text-muted">{category.products_count}</span>
      ) : null}
    </div>
  );
}

export function CategoryFilter({ categories, selected, onToggle, onToggleAll }: CategoryFilterProps) {
  const allRef = useRef<HTMLInputElement>(null);
  const topLevel = categories.filter((c) => c.parent_id === null);
  const allSelected = categories.length > 0 && selected.length === categories.length;
  const someSelected = selected.length > 0 && !allSelected;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = someSelected;
  }, [someSelected]);

  if (categories.length === 0) {
    return <p className="text-sm text-text-muted">Products are not categorized yet.</p>;
  }

  return (
    <div>
      <div className="mb-2 border-b border-border pb-2">
        <div className="flex items-center gap-2.5">
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
            <Checkbox
              ref={allRef}
              checked={allSelected}
              onChange={onToggleAll}
              className="hover:border-text-muted"
            />
            <span className="text-sm font-medium text-text-primary">All categories</span>
          </label>
          <span className="shrink-0 text-xs tabular-nums text-text-muted">{categories.length}</span>
        </div>
      </div>
      <ul className="space-y-0.5" role="group" aria-label="Filter by category">
        {topLevel.map((parent) => {
          const children = categories.filter((c) => c.parent_id === parent.id);
          const childSlugs = children.map((c) => c.slug);
          const selectedChildren = childSlugs.filter((slug) => selected.includes(slug)).length;
          const partial = selectedChildren > 0 && selectedChildren < childSlugs.length;

          return (
            <li key={parent.id} className="space-y-0.5">
              <CategoryRow
                category={parent}
                depth={0}
                selected={selected}
                onToggle={onToggle}
                indeterminate={partial}
              />
              {children.length > 0 ? (
                <ul className="space-y-0.5" role="group" aria-label={parent.name}>
                  {children.map((child) => (
                    <li key={child.id}>
                      <CategoryRow category={child} depth={1} selected={selected} onToggle={onToggle} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}