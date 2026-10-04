import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { spacing } from "@/lib/theme/tokens";

type Props = {
  label: string;
  /** Driven by the caller from Laravel's validation rules. */
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

/**
 * Label + required marker + validation message around any control.
 *
 * Use this for controls that cannot render their own label, or when a field
 * needs an error wired straight from the typed 422 payload. Controls that
 * already accept `label`/`error` (Input, Textarea, Select) should use those
 * props directly instead of being nested here, otherwise the label is
 * duplicated.
 */
export function FormField({ label, required, error, hint, children }: Props) {
  return (
    <View>
      <Text variant="caption" tone="secondary" style={styles.label}>
        {label}
        {required ? " *" : null}
      </Text>

      {children}

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
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  footer: {
    marginTop: spacing.xs,
  },
});
