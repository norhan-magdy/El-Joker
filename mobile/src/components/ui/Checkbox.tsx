import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing } from "@/lib/theme/tokens";

type Props = {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  /** Renders a fillable square, matching a checkbox rather than a radio. */
  shape?: "check" | "radio";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Checkbox({
  checked,
  onToggle,
  label,
  shape = "check",
  disabled = false,
  style,
}: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole={shape === "radio" ? "radio" : "checkbox"}
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        style,
        { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      <View
        style={[
          shape === "radio" ? styles.radio : styles.box,
          {
            borderColor: checked ? colors.primary : colors.borderStrong,
            backgroundColor: checked ? colors.primary : "transparent",
          },
        ]}
      >
        {checked ? (
          <View
            style={[
              styles.mark,
              { backgroundColor: colors.onPrimary },
            ]}
          />
        ) : null}
      </View>

      {label ? (
        <Text variant="body" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  label: {
    flex: 1,
  },
});