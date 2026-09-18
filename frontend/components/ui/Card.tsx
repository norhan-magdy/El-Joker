import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...rest }: CardProps) {
  return <div className={`bg-surface border border-border rounded-lg shadow-sm ${className}`} {...rest} />;
}