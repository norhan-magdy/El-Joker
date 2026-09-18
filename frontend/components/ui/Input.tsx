import { forwardRef, type InputHTMLAttributes } from "react";

const BASE =
  "flex h-10 w-full rounded-md border bg-surface px-3 text-base text-text-primary transition-colors placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ invalid, className = "", ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={`${BASE} ${
          invalid ? "border-error hover:border-error" : "border-border-strong hover:border-text-muted"
        } ${className}`}
        {...rest}
      />
    );
  },
);