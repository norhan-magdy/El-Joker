"use client";

import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({ value, onValueChange, debounceMs = 300, className = "" }: SearchBarProps) {
  const [input, setInput] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (prevValue !== value) {
    setPrevValue(value);
    setInput(value);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const commit = (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onValueChange(next), debounceMs);
  };

  const handleChange = (next: string) => {
    setInput(next);
    commit(next);
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="search"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`Search products\u2026`}
        aria-label="Search products"
        className="h-10 w-full rounded-md border border-border-strong bg-surface pl-9 pr-9 text-base text-text-primary transition-colors placeholder:text-text-muted hover:border-text-muted focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
      />
      {input ? (
        <button
          type="button"
          onClick={() => handleChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-text-muted transition-colors hover:bg-black/5 hover:text-text-primary"
        >
          <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}