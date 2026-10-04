import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Dialog } from "@/components/ui/Dialog";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { PRODUCT_SORTS } from "@/lib/format";
import type { ProductSort } from "@/lib/types";
import { MIN_TOUCH_TARGET, radius, spacing } from "@/lib/theme/tokens";

type Props = {
  value: ProductSort;
  onChange: (value: ProductSort) => void;
};

/**
 * Sort control for the catalogue screens.
 *
 * This used to be a `Select`, which renders its options as a horizontal strip of
 * chips — visually identical to the category chips directly above it, so the two
 * controls read as one confusing row. A single labelled button that opens a
 * sheet keeps sorting distinct from filtering and costs one tap instead of a
 * scrolling strip.
 */
export function SortMenu({ value, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const active = PRODUCT_SORTS.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sort: ${active?.label ?? value}`}
        accessibilityHint="Change sort order"
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Ionicons name="swap-vertical" size={14} color={colors.textMuted} />
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {active?.label ?? value}
        </Text>
        <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
      </Pressable>

      <Dialog visible={open} onClose={() => setOpen(false)} title="Sort by">
        {PRODUCT_SORTS.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primaryWeak : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                variant="body"
                tone={selected ? "primaryBrand" : "primary"}
                style={styles.optionLabel}
              >
                {option.label}
              </Text>

              {selected ? (
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    maxWidth: 190,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  optionLabel: {
    flex: 1,
  },
});
