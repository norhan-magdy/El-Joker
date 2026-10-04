import { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing } from "@/lib/theme/tokens";

type Props = {
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Trailing text; a chevron renders automatically when `onPress` is set. */
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
};

/**
 * Grouped settings-style rows. Shared by the account and admin screens so
 * spacing, hit targets, and icon alignment stay identical across the app.
 */
export function ListRowGroup({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

export function ListRowItem({
  label,
  description,
  icon,
  value,
  onPress,
  chevron = true,
  destructive = false,
}: Props) {
  const { colors } = useTheme();
  const tint = destructive ? colors.error : colors.textPrimary;

  const body = (
    <>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colors.overlay }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
      ) : null}

      <View style={styles.labels}>
        <Text variant="body" style={{ color: tint }}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text variant="caption" tone="muted" style={styles.value}>
          {value}
        </Text>
      ) : null}

      {onPress && chevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    { borderColor: colors.border, backgroundColor: colors.surface },
  ];

  if (!onPress) {
    return <View style={rowStyle}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [rowStyle, pressed && { opacity: 0.7 }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  labels: {
    flex: 1,
    gap: 2,
  },
  value: {
    maxWidth: 140,
    textAlign: "right",
  },
});
