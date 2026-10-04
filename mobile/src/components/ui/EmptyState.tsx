import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { spacing } from "@/lib/theme/tokens";

type Props = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** SF Symbol or Material glyph name, rendered by the caller. */
  icon?: React.ReactNode;
};

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {icon}
      <Text variant="heading" tone="primary" style={styles.title}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" tone="muted" style={styles.message}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
  },
});