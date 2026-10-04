import { forwardRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { fontSize, radius, spacing } from "@/lib/theme/tokens";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Textarea = forwardRef<TextInput, Props>(function Textarea(
  { label, error, hint, containerStyle, style, ...rest },
  ref
) {
  const { colors } = useTheme();

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="caption" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <TextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
          style,
        ]}
        {...rest}
      />

      <View style={styles.footerRow}>
        {error ? (
          <Text variant="caption" tone="error" style={styles.error}>
            {error}
          </Text>
        ) : hint ? (
          <Text variant="caption" tone="muted" style={styles.hint}>
            {hint}
          </Text>
        ) : (
          <View />
        )}
        {typeof rest.maxLength === "number" ? (
          <Text variant="caption" tone="muted">
            {`${String(rest.value ?? "").length}/${rest.maxLength}`}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
  },
  footerRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  error: {
    flex: 1,
  },
  hint: {
    flex: 1,
  },
});