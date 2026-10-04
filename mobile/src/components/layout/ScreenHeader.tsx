import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { spacing } from "@/lib/theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  /** Rendered at the trailing edge, e.g. a sign-out or theme toggle. */
  action?: ReactNode;
};

/**
 * Screen header for tab roots, where the native navigation header is hidden so
 * content can begin at the very top of the screen.
 *
 * Kept to one compact row on purpose: this sits above a product grid, and the
 * display-sized treatment it replaced ate enough height to leave a small phone
 * showing barely one row of tiles.
 */
export function ScreenHeader({ title, subtitle, action }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.md }]}>
      <View style={[styles.rule, { backgroundColor: colors.primary }]} />

      <View style={styles.text}>
        <Text variant="title" tone="primary" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  rule: {
    width: 3,
    height: 22,
    borderRadius: 2,
  },
});
