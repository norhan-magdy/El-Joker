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

export const Input = forwardRef<TextInput, Props>(function Input(
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
          error && styles.inputError,
          style,
        ]}
        {...rest}
      />

      {error ? (
        <Text variant="caption" tone="error" style={styles.footer}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted" style={styles.footer}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
  },
  inputError: {
    borderWidth: 1.5,
  },
  footer: {
    marginTop: spacing.xs,
  },
});