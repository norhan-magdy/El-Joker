import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { Text } from "@/components/ui/Text";
import { formatMoney } from "@/lib/format";
import { fontSize, spacing } from "@/lib/theme/tokens";

type Props = {
  amount: number;
  /** Renders the amount struck through, for a discounted line. */
  compareAt?: number;
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
};

/**
 * Font size and line height travel together. Overriding only `fontSize` on a
 * `Text` leaves the variant's `lineHeight` behind, so a 17pt price would sit on
 * a 26pt line and drift out of alignment with whatever shares its row.
 */
const SIZES = {
  sm: { font: fontSize.sm, line: fontSize.sm * 1.4 },
  md: { font: fontSize.lg, line: fontSize.lg * 1.3 },
  lg: { font: fontSize.xxl, line: fontSize.xxl * 1.25 },
} as const;

/**
 * Prices are always rendered from the server's integer/float value through
 * `formatMoney` so cart totals and product cards can never disagree on
 * rounding.
 */
export function Price({ amount, compareAt, size = "md", style }: Props) {
  const { font, line } = SIZES[size];
  const discounted = typeof compareAt === "number" && compareAt > amount;
  const textStyle: TextStyle = {
    fontSize: font,
    lineHeight: line,
    // Keeps columns of prices optically aligned.
    fontVariant: ["tabular-nums"],
  };

  return (
    <View style={[styles.row, style]}>
      <Text variant={size === "sm" ? "body" : "heading"} style={textStyle}>
        {formatMoney(amount)}
      </Text>
      {discounted ? (
        <Text variant="caption" tone="muted" style={styles.compare}>
          {formatMoney(compareAt)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  compare: {
    textDecorationLine: "line-through",
  },
});
