import { Text as RNText, StyleSheet, type TextProps } from "react-native";

import { fontSize } from "@/lib/theme/tokens";
import { useTheme } from "@/hooks/use-theme";

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "bodyStrong"
  | "caption"
  | "mono";

export type TextTone =
  | "primary"
  | "secondary"
  | "muted"
  | "primaryBrand"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "onPrimary";

type Props = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

export function Text({
  variant = "body",
  tone = "primary",
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();

  const toneColor = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    primaryBrand: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    onPrimary: colors.onPrimary,
  }[tone];

  return (
    <RNText
      {...rest}
      style={[styles.base, styles[variant], { color: toneColor }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.45,
  },
  display: {
    fontSize: fontSize.xxxl,
    lineHeight: fontSize.xxxl * 1.2,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  title: {
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl * 1.25,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * 1.3,
    fontWeight: "700",
  },
  body: {
    fontWeight: "400",
  },
  bodyStrong: {
    fontWeight: "600",
  },
  caption: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
  mono: {
    fontSize: fontSize.sm,
    fontFamily: "monospace",
  },
});