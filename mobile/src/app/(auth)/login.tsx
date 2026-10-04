import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormBanner, errorTone } from "@/components/ui/FormBanner";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { errorMessage, isRateLimited } from "@/lib/api/errors";
import { applyServerErrors } from "@/lib/forms";
import { loginSchema, type LoginValues } from "@/lib/schemas";
import { spacing } from "@/lib/theme/tokens";
import { type SessionEndReason, useAuthStore } from "@/store/auth";

/**
 * Why the session ended, phrased for the user.
 *
 * The backend deletes every same-named token before issuing a new one, so
 * signing in on the web silently kills the phone's token. Saying so is the
 * difference between "log in again" and "why is it asking me to log in again".
 */
const ENDED_COPY: Record<SessionEndReason, string> = {
  revoked_elsewhere:
    "Your session ended because the same account signed in somewhere else. Signing in here replaces that session.",
  expired: "Your session expired. Please sign in again.",
  logged_out: "You have been signed out.",
};

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const endedReason = useAuthStore((s) => s.endedReason);
  const clearEndedReason = useAuthStore((s) => s.clearEndedReason);

  const [formError, setFormError] = useState<unknown>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.email.trim(), values.password);
      // The guard on the parent stack unmounts this group the moment a session
      // exists, so there is nothing to clean up on success.
    } catch (error) {
      if (!applyServerErrors(form.setError, error)) setFormError(error);
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track orders and manage your cart."
      footer={
        <View style={styles.footer}>
          <Text variant="caption" tone="muted">
            New here?
          </Text>
          <Link href="/register" asChild>
            <Pressable accessibilityRole="link" hitSlop={8}>
              <Text variant="caption" tone="primaryBrand">
                Create an account
              </Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      {endedReason ? (
        <FormBanner
          message={ENDED_COPY[endedReason]}
          tone="warning"
        />
      ) : null}

      {formError ? (
        <FormBanner message={errorMessage(formError)} tone={errorTone(formError)} />
      ) : null}

      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <Input
            label="Email"
            value={field.value}
            onChangeText={(next) => {
              clearEndedReason();
              field.onChange(next);
            }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={form.handleSubmit(() => {})}
            containerStyle={styles.field}
          />
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <Input
            label="Password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            containerStyle={styles.field}
          />
        )}
      />

      <Button
        label={isRateLimited(formError) ? "Wait to retry" : "Sign in"}
        onPress={onSubmit}
        loading={form.formState.isSubmitting}
        disabled={isRateLimited(formError)}
        fullWidth
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Administrator sign in"
        accessibilityHint="Opens the staff sign-in screen"
        onPress={() => router.push("/admin-login")}
        hitSlop={8}
        style={styles.adminLink}
      >
        <Text variant="caption" tone="muted">
          Staff? Sign in to the admin console
        </Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  adminLink: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
});
