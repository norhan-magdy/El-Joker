import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { isRateLimited } from "@/lib/api/errors";
import { radius, spacing } from "@/lib/theme/tokens";

type Props = {
  message: string;
  tone?: "error" | "warning" | "info" | "success";
};

const ICONS: Record<NonNullable<Props["tone"]>, keyof typeof Ionicons.glyphMap> = {
  error: "alert-circle",
  warning: "warning",
  info: "information-circle",
  success: "checkmark-circle",
};

/**
 * Inline banner for form-level messages: a 422 without field errors, a
 * throttle notice, or an explanation of why a session just ended.
 */
export function FormBanner({ message, tone = "error" }: Props) {
  const { colors } = useTheme();

  const palette = {
    error: { bg: colors.errorBg, fg: colors.error },
    warning: { bg: colors.warningBg, fg: colors.warning },
    info: { bg: colors.infoBg, fg: colors.info },
    success: { bg: colors.successBg, fg: colors.success },
  }[tone];

  return (
    <View
      accessibilityRole="alert"
      style={[styles.wrap, { backgroundColor: palette.bg }]}
    >
      <Ionicons name={ICONS[tone]} size={18} color={palette.fg} />
      <Text variant="caption" style={[styles.text, { color: palette.fg }]}>
        {message}
      </Text>
    </View>
  );
}

/** Picks the right tone for an unknown error value. */
export function errorTone(error: unknown): "error" | "warning" | "info" {
  if (isRateLimited(error)) return "warning";
  if (error && typeof error === "object" && "status" in error && error.status === 0) {
    return "info";
  }
  return "error";
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
  },
});
