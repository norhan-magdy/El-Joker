"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatMoney } from "@/lib/constants";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export interface PriceRangeValue {
  min: number;
  max: number;
}

interface PriceRangeSliderProps {
  bounds: PriceRangeValue;
  value: PriceRangeValue;
  onChange: (next: PriceRangeValue) => void;
  debounceMs?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const toNumber = (raw: string): number | null => {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export function PriceRangeSlider({ bounds, value, onChange, debounceMs = 300 }: PriceRangeSliderProps) {
  const clamped = useMemo(
    () => ({
      min: Math.min(Math.max(value.min, bounds.min), bounds.max),
      max: Math.max(Math.min(value.max, bounds.max), bounds.min),
    }),
    [value, bounds],
  );
  const [live, setLive] = useState(clamped);
  const [prevClamped, setPrevClamped] = useState(clamped);
  const [minText, setMinText] = useState(String(clamped.min));
  const [maxText, setMaxText] = useState(String(clamped.max));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (clamped.min !== prevClamped.min || clamped.max !== prevClamped.max) {
    setPrevClamped(clamped);
    setLive(clamped);
    setMinText(String(clamped.min));
    setMaxText(String(clamped.max));
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const commit = (next: PriceRangeValue, immediate = false) => {
    if (timer.current) clearTimeout(timer.current);
    if (immediate) {
      onChange(next);
      return;
    }
    timer.current = setTimeout(() => onChange(next), debounceMs);
  };

  const handleMin = (raw: number) => {
    const min = Math.min(raw, live.max);
    const next = { min, max: live.max };
    setLive(next);
    setMinText(String(min));
    commit(next);
  };

  const handleMax = (raw: number) => {
    const max = Math.max(raw, live.min);
    const next = { min: live.min, max };
    setLive(next);
    setMaxText(String(max));
    commit(next);
  };

  const commitMinInput = () => {
    const parsed = toNumber(minText);
    const currentMax = Math.max(live.max, bounds.min);
    const min = parsed === null ? bounds.min : clamp(parsed, bounds.min, currentMax);
    const next = { min, max: currentMax };
    setLive(next);
    setMinText(String(min));
    commit(next, true);
  };

  const commitMaxInput = () => {
    const parsed = toNumber(maxText);
    const currentMin = Math.min(live.min, bounds.max);
    const max = parsed === null ? bounds.max : clamp(parsed, currentMin, bounds.max);
    const next = { min: currentMin, max };
    setLive(next);
    setMaxText(String(max));
    commit(next, true);
  };

  const flushOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const span = bounds.max - bounds.min;
  if (span <= 0) {
    return <p className="text-sm text-text-muted">Price range not available.</p>;
  }

  const minPct = ((live.min - bounds.min) / span) * 100;
  const maxPct = ((live.max - bounds.min) / span) * 100;

  const inputClass =
    "range-thumb absolute inset-0 h-full w-full appearance-none bg-transparent outline-none";

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="price-min">Min price</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-text-muted">
              $
            </span>
            <Input
              id="price-min"
              type="number"
              min={bounds.min}
              max={bounds.max}
              step={1}
              className="pl-6"
              value={minText}
              onChange={(e) => setMinText(e.target.value)}
              onBlur={commitMinInput}
              onKeyDown={flushOnEnter}
              aria-label="Minimum price"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price-max">Max price</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-text-muted">
              $
            </span>
            <Input
              id="price-max"
              type="number"
              min={bounds.min}
              max={bounds.max}
              step={1}
              className="pl-6"
              value={maxText}
              onChange={(e) => setMaxText(e.target.value)}
              onBlur={commitMaxInput}
              onKeyDown={flushOnEnter}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      <div className="relative mt-3 h-6">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-border-strong" />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded bg-primary"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          className={inputClass}
          aria-label="Minimum price"
          aria-valuetext={formatMoney(live.min)}
          min={bounds.min}
          max={bounds.max}
          step={1}
          value={live.min}
          onChange={(e) => handleMin(e.target.valueAsNumber)}
        />
        <input
          type="range"
          className={inputClass}
          aria-label="Maximum price"
          aria-valuetext={formatMoney(live.max)}
          min={bounds.min}
          max={bounds.max}
          step={1}
          value={live.max}
          onChange={(e) => handleMax(e.target.valueAsNumber)}
        />
      </div>

      <p className="mt-2 text-xs text-text-muted">
        Available prices: {formatMoney(bounds.min)} – {formatMoney(bounds.max)}
      </p>
    </div>
  );
}