import { cn } from "@/lib/cn";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 16, className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="block h-full w-full animate-spin rounded-full border-2 border-text-muted/30 border-t-primary"
        aria-hidden
      />
      <span className="sr-only">Loading{`\u2026`}</span>
    </span>
  );
}