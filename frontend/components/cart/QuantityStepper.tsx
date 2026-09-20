"use client";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 100,
  onChange,
  disabled = false,
}: QuantityStepperProps) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };
  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <span className="inline-flex items-center rounded-md border border-border-strong bg-surface">
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="inline-flex h-8 w-8 items-center justify-center rounded-l-md text-text-secondary transition-colors hover:bg-overlay disabled:cursor-not-allowed disabled:text-disabled-text disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" />
        </svg>
      </button>
      <span className="min-w-9 px-1 text-center text-sm font-medium tabular-nums text-text-primary" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
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