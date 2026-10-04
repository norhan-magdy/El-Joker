import { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { spacing } from "@/lib/theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered pinned below the fields, e.g. "create an account". */
  footer?: ReactNode;
};

/**
 * Shared chrome for the login, register, and admin-login screens. Owns the
 * safe-area and keyboard behaviour so those screens only contain their form.
 */
export function AuthShell({ title, subtitle, children, footer }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xxxl,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={[styles.rule, { backgroundColor: colors.primary }]} />
          <Text variant="title" tone="primary" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.form}>{children}</View>
      </ScrollView>

      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + spacing.lg,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  intro: {
    gap: spacing.sm,
  },
  rule: {
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  form: {
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
});
