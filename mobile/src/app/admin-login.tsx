import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormBanner, errorTone } from "@/components/ui/FormBanner";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { errorMessage, isRateLimited } from "@/lib/api/errors";
import { applyServerErrors } from "@/lib/forms";
import { adminLoginSchema, type LoginValues } from "@/lib/schemas";
import { spacing } from "@/lib/theme/tokens";
import { useAuthStore } from "@/store/auth";

export default function AdminLoginScreen() {
  const adminLogin = useAuthStore((s) => s.adminLogin);
  const [formError, setFormError] = useState<unknown>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await adminLogin(values.email.trim(), values.password);
      // The customer session is untouched by staff sign-in, so an admin-only
      // device stays on this screen and has to be moved into the console here.
      router.replace("/admin");
    } catch (error) {
      if (!applyServerErrors(form.setError, error)) setFormError(error);
    }
  });

  return (
    <AuthShell
      title="Staff sign in"
      subtitle="Uses the admin console. This is a separate session from your customer account."
    >
      {formError ? (
        <FormBanner
          message={errorMessage(formError)}
          tone={errorTone(formError)}
        />
      ) : null}

      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <Input
            label="Admin email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            returnKeyType="next"
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
        label={isRateLimited(formError) ? "Wait to retry" : "Open console"}
        onPress={onSubmit}
        loading={form.formState.isSubmitting}
        disabled={isRateLimited(formError)}
        fullWidth
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to customer sign in"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/home");
        }}
        hitSlop={8}
        style={styles.backLink}
      >
        <Text variant="caption" tone="muted">
          Back to customer sign in
        </Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  backLink: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
});
