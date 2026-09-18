"use client";

import type { Category } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  const topLevel = categories.filter((c) => c.parent_id === null);

  if (topLevel.length === 0) {
    return <p className="text-sm text-text-muted">Products are not categorized yet.</p>;
  }

  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={selected === null}
        className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 ${
          selected === null
            ? "border border-primary/40 bg-primary-weak text-primary"
            : "border border-border-strong bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary"
        }`}
      >
        All
      </button>
      {topLevel.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(selected === c.slug ? null : c.slug)}
          aria-pressed={selected === c.slug}
          className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 ${
            selected === c.slug
              ? "border border-primary/40 bg-primary-weak text-primary"
              : "border border-border-strong bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}