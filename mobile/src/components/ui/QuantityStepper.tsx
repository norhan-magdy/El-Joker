import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { clampQuantity, maxSelectable } from "@/lib/format";
import { fontSize, radius } from "@/lib/theme/tokens";

type Props = {
  value: number;
  stock?: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
};

const STEP = 1;

/**
 * Cart quantity control.
 *
 * The ceiling comes from `maxSelectable`, which folds in both the API's hard cap
 * and the currently known stock. It has to be the *limit*, not the clamped
 * current value: passing the current value through `clampQuantity` returns that
 * same value, which makes `value >= ceiling` unconditionally true and leaves the
 * increment button permanently disabled.
 *
 * The field is still editable by hand because the server owns the real limit: a
 * stale cached stock value must never be the thing that blocks a legitimate add.
 */
export function QuantityStepper({
  value,
  stock,
  onChange,
  disabled = false,
}: Props) {
  const { colors } = useTheme();
  const limit = maxSelectable(stock);

  const atFloor = value <= 1;
  const atCeiling = value >= limit;

  const step = (delta: number) =>
    onChange(clampQuantity(value + delta * STEP, stock, 1));

  const button = (label: string, delta: number, disabledNow: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={delta > 0 ? "Increase quantity" : "Decrease quantity"}
      disabled={disabled || disabledNow}
      onPress={() => step(delta)}
      hitSlop={8}
      style={({ pressed }) => [
        styles.stepButton,
        {
          backgroundColor: colors.overlay,
          opacity: disabled || disabledNow ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        variant="body"
        style={{ color: colors.textPrimary, fontSize: fontSize.lg, lineHeight: fontSize.lg * 1.2 }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.wrap,
        { borderColor: colors.border, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {button("−", -1, atFloor)}

      <TextInput
        value={String(value)}
        onChangeText={(raw) => {
          const parsed = Number.parseInt(raw.replace(/[^0-9]/g, ""), 10);
          onChange(Number.isNaN(parsed) ? 1 : parsed);
        }}
        onBlur={() => onChange(clampQuantity(value, stock, 1))}
        keyboardType="number-pad"
        editable={!disabled}
        selectTextOnFocus
        accessibilityLabel="Quantity"
        style={[styles.input, { color: colors.textPrimary }]}
      />

      {button("+", 1, atCeiling)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  stepButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: 48,
    height: 40,
    textAlign: "center",
    fontSize: fontSize.md,
    paddingVertical: 0,
    margin: 0,
  },
});