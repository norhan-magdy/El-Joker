import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing } from "@/lib/theme/tokens";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type Props<T extends string | number> = {
  label?: string;
  /**
   * The selected option's value, or `null` when nothing is selected yet. Pass
   * this through verbatim: `""` is a legitimate option value (the admin parent
   * picker uses it for "top level"), so coercing it away with `value || null`
   * makes that option impossible to show as selected.
   */
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
  /** Lays the options out as wrapping chips instead of a horizontal list. */
  variant?: "list" | "chips";
  /** Fires on every mount; used by admin forms to clear a dependent field. */
  onOpen?: () => void;
};

/**
 * A cross-platform replacement for a native picker. A real `<select>` does not
 * exist in React Native, and the platform pickers render inconsistently
 * between iOS and Android, so options are rendered inline instead.
 */
export function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
  error,
  variant = "list",
  onOpen,
}: Props<T>) {
  const { colors } = useTheme();

  const optionChip = (option: SelectOption<T>) => {
    const active = option.value === value;
    return (
      <Pressable
        key={String(option.value)}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        accessibilityLabel={option.label}
        onPress={() => onChange(option.value)}
        style={({ pressed }) => [
          styles.option,
          {
            backgroundColor: active ? colors.primary : colors.surface,
            borderColor: active ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          variant="caption"
          style={{ color: active ? colors.onPrimary : colors.textSecondary }}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View>
      {label ? (
        <Text variant="caption" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}

      {/*
        The empty state is rendered outside the variant branches on purpose. An
        empty option list is what a failed or still-loading query produces, and
        a branch that maps over nothing would render a bare label with a blank
        gap under it — the user sees no options, no placeholder, and no reason.
      */}
      {options.length === 0 ? (
        <Text variant="caption" tone="muted">
          {placeholder}
        </Text>
      ) : variant === "chips" ? (
        <View style={styles.chipWrap} onTouchStart={onOpen}>
          {options.map(optionChip)}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          onTouchStart={onOpen}
          contentContainerStyle={styles.list}
        >
          {options.map(optionChip)}
        </ScrollView>
      )}

      {error ? (
        <Text variant="caption" tone="error" style={styles.footer}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  list: {
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
    paddingRight: spacing.sm,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  footer: {
    marginTop: spacing.xs,
  },
});