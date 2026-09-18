import { forwardRef, type TextareaHTMLAttributes } from "react";

const BASE =
  "flex min-h-[96px] w-full rounded-md border bg-surface p-3 text-base text-text-primary transition-colors placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className = "", ...rest }, ref) {
    return (
      <textarea
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