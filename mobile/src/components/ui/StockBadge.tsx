import { Badge } from "@/components/ui/Badge";
import { stockState } from "@/lib/format";

/**
 * Stock availability for a product card or detail screen.
 *
 * `stock` is `undefined` whenever the API omitted the eager-loaded inventory,
 * so an unknown quantity deliberately renders as neutral rather than "in stock".
 */
export function StockBadge({ stock }: { stock: number | undefined }) {
  const state = stockState(stock);

  switch (state.kind) {
    case "out":
      return <Badge label="Out of stock" tone="error" />;
    case "low":
      return <Badge label={`Only ${state.remaining} left`} tone="warning" />;
    case "available":
      return <Badge label="In stock" tone="success" />;
    default:
      return <Badge label="Availability at checkout" tone="neutral" />;
  }
}
