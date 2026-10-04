import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { MIN_TOUCH_TARGET, radius, spacing } from "@/lib/theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessibilityHint,
  testID,
}: Props) {
  const { colors } = useTheme();
  const inert = disabled || loading;

  const palette = {
    primary: {
      bg: colors.primary,
      fg: colors.onPrimary,
      border: colors.primary,
      pressed: colors.primaryActive,
    },
    secondary: {
      bg: "transparent",
      fg: colors.primary,
      border: colors.borderStrong,
      pressed: colors.primaryWeak,
    },
    ghost: {
      bg: "transparent",
      fg: colors.textSecondary,
      border: "transparent",
      pressed: colors.overlayActive,
    },
    danger: {
      bg: colors.error,
      fg: colors.onError,
      border: colors.error,
      pressed: colors.errorActive,
    },
  }[variant];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: inert
            ? colors.disabledBg
            : pressed
              ? palette.pressed
              : palette.bg,
          borderColor: inert ? colors.disabledBorder : palette.border,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={inert ? colors.disabledText : palette.fg}
        />
      ) : (
        <Text
          variant={size === "sm" ? "caption" : "bodyStrong"}
          style={{ color: inert ? colors.disabledText : palette.fg }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
  },
  fullWidth: {
    width: "100%",
  },
});

const sizeStyles = StyleSheet.create<Record<ButtonSize, ViewStyle>>({
  sm: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  md: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});

export { styles as buttonStyles };