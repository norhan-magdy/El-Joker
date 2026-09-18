"use client";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-50 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-sm outline-none ring-2 ring-focus ring-offset-2 focus:not-sr-only focus:translate-y-0 focus:opacity-100 sr-only"
    >
      Skip to content
    </a>
  );
}