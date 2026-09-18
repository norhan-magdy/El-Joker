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
        className={`h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded border border-border-strong bg-white transition-colors checked:border-primary checked:bg-primary checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22white%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M16.704%205.29a1%201%200%200%201%20.006%201.414l-5.5%205.5a1%201%200%200%201-1.414%200l-2.5-2.5a1%201%200%200%201%201.414-1.414L10.5%2010.586l4.79-4.79a1%201%200%200%201%201.414-.006Z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] hover:border-text-muted focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg ${className}`}
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