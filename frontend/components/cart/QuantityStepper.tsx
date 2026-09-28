"use client";

import { useState } from "react";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

interface Draft {
  /** server value the draft was typed against, so a stock refetch discards it */
  base: number;
  text: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function QuantityStepper({
  value,
  min = 1,
  max = 100,
  onChange,
  disabled = false,
}: QuantityStepperProps) {
  // stock can drop below the requested min, the control still has to render
  const upper = Math.max(min, max);
  const [draft, setDraft] = useState<Draft | null>(null);
  const text = draft && draft.base === value ? draft.text : String(value);

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    setDraft(null);
    if (Number.isNaN(parsed)) return;
    const next = clamp(parsed, min, upper);
    if (next !== value) onChange(next);
  };

  const step = (delta: number) => {
    const next = clamp(value + delta, min, upper);
    if (next !== value) onChange(next);
  };

  return (
    <span className="inline-flex items-center rounded-md border border-border-strong bg-surface">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="inline-flex h-8 w-8 items-center justify-center rounded-l-md text-text-secondary transition-colors hover:bg-overlay disabled:cursor-not-allowed disabled:text-disabled-text disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" />
        </svg>
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={text}
        min={min}
        max={upper}
        disabled={disabled}
        onChange={(e) => setDraft({ base: value, text: e.target.value })}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(text);
          }
          if (e.key === "Escape") setDraft(null);
        }}
        aria-label="Quantity"
        className="w-11 border-0 bg-transparent p-0 text-center text-sm font-medium tabular-nums text-text-primary focus-visible:outline-none disabled:text-disabled-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={disabled || value >= upper}
        aria-label="Increase quantity"
        className="inline-flex h-8 w-8 items-center justify-center rounded-r-md text-text-secondary transition-colors hover:bg-overlay disabled:cursor-not-allowed disabled:text-disabled-text disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
      </button>
    </span>
  );
}
