import { formatMoney } from "@/lib/constants";

interface PriceProps {
  value: number;
  className?: string;
}

export function Price({ value, className = "" }: PriceProps) {
  return <span className={`tabular-nums ${className}`}>{formatMoney(value)}</span>;
}