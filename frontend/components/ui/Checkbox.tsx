import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, id, className = "", ...rest }, ref) {
    const input = (
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={`checkbox h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded border border-border-strong bg-surface transition-colors checked:border-primary checked:bg-primary hover:border-text-muted focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg ${className}`}
        {...rest}
      />
    );

    if (!label) return input;

    return (
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-sm text-text-primary">
        {input}
        <span>{label}</span>
      </label>
    );
  },
);