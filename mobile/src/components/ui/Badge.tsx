import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing } from "@/lib/theme/tokens";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "error"
  | "info";

type Props = {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = "neutral", style }: Props) {
  const { colors } = useTheme();

  const palette = {
    neutral: { bg: colors.overlay, fg: colors.textSecondary },
    brand: { bg: colors.primaryWeak, fg: colors.primary },
    success: { bg: colors.successBg, fg: colors.success },
    warning: { bg: colors.warningBg, fg: colors.warning },
    error: { bg: colors.errorBg, fg: colors.error },
    info: { bg: colors.infoBg, fg: colors.info },
  }[tone];

  return (
    <View
      style={[styles.base, { backgroundColor: palette.bg }, style]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text
        variant="caption"
        numberOfLines={1}
        style={[styles.text, { color: palette.fg }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  text: {
    fontWeight: "600",
  },
});