import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { spacing } from "@/lib/theme/tokens";

export function Spinner({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? "Loading"}
      style={styles.wrap}
    >
      <ActivityIndicator color={colors.primary} />
      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
});