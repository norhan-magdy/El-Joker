import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { fontSize, radius, spacing } from "@/lib/theme/tokens";

type Props = {
  page: number;
  totalPages: number;
  totalItems?: number;
  onChange: (page: number) => void;
  disabled?: boolean;
};

/**
 * Server-side pagination.
 *
 * Paging state is owned by the URL (search params), so this is a controlled
 * component: it renders the window and reports intent, and never fetches.
 */
export function Pagination({
  page,
  totalPages,
  totalItems,
  onChange,
  disabled = false,
}: Props) {
  const { colors } = useTheme();

  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  const navButton = (label: string, target: number, disabledNow: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabledNow }}
      disabled={disabled || disabledNow}
      onPress={() => onChange(target)}
      hitSlop={8}
      style={({ pressed }) => [
        styles.nav,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          opacity: disabled || disabledNow ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {navButton("‹ Prev", page - 1, atStart)}

        <View style={styles.pages}>
          {pages.map((entry, index) =>
            entry === null ? (
              <Text
                key={`gap-${index}`}
                variant="caption"
                tone="muted"
                style={styles.gap}
              >
                …
              </Text>
            ) : (
              <Pressable
                key={entry}
                accessibilityRole="button"
                accessibilityLabel={`Page ${entry}`}
                accessibilityState={{ selected: entry === page }}
                disabled={disabled}
                onPress={() => onChange(entry)}
                style={({ pressed }) => [
                  styles.page,
                  {
                    backgroundColor:
                      entry === page ? colors.primary : colors.surface,
                    borderColor:
                      entry === page ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: entry === page ? colors.onPrimary : colors.textSecondary,
                  }}
                >
                  {entry}
                </Text>
              </Pressable>
            )
          )}
        </View>

        {navButton("Next ›", page + 1, atEnd)}
      </View>

      {typeof totalItems === "number" ? (
        <Text variant="caption" tone="muted" style={styles.summary}>
          {`Page ${page} of ${totalPages} · ${totalItems} item${
            totalItems === 1 ? "" : "s"
          }`}
        </Text>
      ) : null}
    </View>
  );
}

/** First, last, and a sliding window around the current page. */
function pageWindow(page: number, totalPages: number): (number | null)[] {
  const window = new Set<number>([1, totalPages]);

  for (let p = page - 1; p <= page + 1; p += 1) {
    if (p >= 1 && p <= totalPages) window.add(p);
  }

  const sorted = [...window].sort((a, b) => a - b);
  const out: (number | null)[] = [];

  sorted.forEach((entry, index) => {
    if (index > 0 && entry - sorted[index - 1] > 1) out.push(null);
    out.push(entry);
  });

  return out;
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pages: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  nav: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  page: {
    minWidth: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  gap: {
    fontSize: fontSize.md,
  },
  summary: {
    textAlign: "center",
  },
});
