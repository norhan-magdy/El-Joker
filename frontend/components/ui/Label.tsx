import { forwardRef, type LabelHTMLAttributes } from "react";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  function Label({ className = "", ...rest }, ref) {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium leading-5 text-text-primary ${className}`}
        {...rest}
      />
    );
  },
);