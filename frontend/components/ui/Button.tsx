import { cloneElement, forwardRef, isValidElement, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "link" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active shadow-sm disabled:bg-disabled-bg disabled:text-disabled-text disabled:border disabled:border-disabled-border",
  secondary:
    "bg-surface border border-border-strong text-text-primary shadow-sm hover:border-text-muted hover:bg-[#FAF8F4] active:border-text-muted active:bg-[#F1EDE6] disabled:bg-disabled-bg disabled:text-disabled-text disabled:border-disabled-border",
  ghost:
    "text-text-secondary hover:bg-black/5 hover:text-text-primary active:bg-black/10 disabled:text-disabled-text",
  destructive:
    "bg-error text-white hover:bg-[#961D16] active:bg-[#7E1712] disabled:bg-disabled-bg disabled:text-disabled-text disabled:border disabled:border-disabled-border",
  link: "text-primary hover:text-primary-hover underline-offset-4 hover:underline px-0 h-auto font-medium disabled:text-disabled-text",
  icon: "h-11 w-11 rounded-md text-text-secondary hover:bg-black/5 hover:text-text-primary active:bg-black/10 disabled:text-disabled-text disabled:bg-transparent",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", loading = false, icon, fullWidth = false, disabled, asChild = false, children, className = "", ...rest }, ref) {
    const v = icon ? "icon" : variant;
    const classes = `inline-flex items-center justify-center gap-2 rounded-lg font-medium text-sm h-10 px-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed ${fullWidth ? "w-full" : ""} ${VARIANT_CLASSES[v]} ${className}`;

    if (asChild && isValidElement(children)) {
      return cloneElement(
        children as React.ReactElement<{ className?: string }>,
        {
          ...rest,
          disabled: disabled || loading,
          className: `${(children.props as { className?: string }).className ?? ""} ${classes}`,
        } as Record<string, unknown>,
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...rest}
      >
        {loading ? (
          <>
            <Spinner size={16} />
            {v !== "icon" && <span>Saving{"\u2026"}</span>}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);