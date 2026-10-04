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
import { registerSchema, type RegisterValues } from "@/lib/schemas";
import { spacing } from "@/lib/theme/tokens";
import { useAuthStore } from "@/store/auth";

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register);
  const [formError, setFormError] = useState<unknown>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      // Registration returns a token, so the guard flips and this group unmounts.
    } catch (error) {
      if (!applyServerErrors(form.setError, error)) setFormError(error);
    }
  });

  return (
    <AuthShell
      title="Create an account"
      subtitle="Track orders and keep a cart across devices."
      footer={
        <View style={styles.footer}>
          <Text variant="caption" tone="muted">
            Already registered?
          </Text>
          <Link href="/login" asChild>
            <Pressable accessibilityRole="link" hitSlop={8}>
              <Text variant="caption" tone="primaryBrand">
                Sign in
              </Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      {formError ? (
        <FormBanner
          message={errorMessage(formError)}
          tone={errorTone(formError)}
        />
      ) : null}

      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Input
            label="Name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            containerStyle={styles.field}
          />
        )}
      />

      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <Input
            label="Email"
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
            hint="At least 8 characters."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            containerStyle={styles.field}
          />
        )}
      />

      <Controller
        control={form.control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <Input
            label="Confirm password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            containerStyle={styles.field}
          />
        )}
      />

      <Button
        label={isRateLimited(formError) ? "Wait to retry" : "Create account"}
        onPress={onSubmit}
        loading={form.formState.isSubmitting}
        disabled={isRateLimited(formError)}
        fullWidth
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to sign in"
        onPress={() => router.back()}
        hitSlop={8}
        style={styles.backLink}
      >
        <Text variant="caption" tone="muted">
          Back to sign in
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
  backLink: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
});
