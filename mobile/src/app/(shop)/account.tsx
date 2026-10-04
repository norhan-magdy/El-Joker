import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { ListRowGroup, ListRowItem } from "@/components/layout/ListRow";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { spacing } from "@/lib/theme/tokens";
import type { ThemePreference } from "@/lib/theme/types";
import {
  isAdminSession,
  useAuthStore,
} from "@/store/auth";
import { useQueryClient } from "@tanstack/react-query";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/**
 * Account hub.
 *
 * Signed out this screen is still useful — theme preference lives here — which
 * avoids forcing a login just to change how the app looks. Browsing never
 * requires an account, matching the web storefront.
 */
export default function AccountScreen() {
  const { colors, preference, setPreference } = useTheme();
  const queryClient = useQueryClient();

  const customer = useAuthStore((s) => s.customer);
  const admin = useAuthStore((s) => s.admin);
  const logoutCustomer = useAuthStore((s) => s.logoutCustomer);
  const logoutAdmin = useAuthStore((s) => s.logoutAdmin);

  const [confirming, setConfirming] = useState<"customer" | "admin" | null>(null);

  /**
   * Everything cached for a session is user-scoped, so signing out has to clear
   * the whole client. Leaving it would let the next person to sign in on this
   * device see the previous customer's cart and orders before a refetch lands.
   */
  const signOutAndReset = async (scope: "customer" | "admin") => {
    setConfirming(null);
    if (scope === "customer") {
      await logoutCustomer();
      router.dismissAll();
    } else {
      await logoutAdmin();
    }
    queryClient.clear();
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Account"
        subtitle={customer ? `Signed in as ${customer.user.email}` : undefined}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {customer ? (
          <Card style={styles.card}>
            <Text variant="heading" tone="primary">
              {customer.user.name}
            </Text>
            <Text variant="caption" tone="muted">
              {customer.user.email}
            </Text>
            <View style={styles.actions}>
              <Button
                label="Orders"
                onPress={() => router.push("/orders")}
                variant="secondary"
                style={styles.action}
              />
              <Button
                label="Cart"
                onPress={() => router.push("/cart")}
                variant="secondary"
                style={styles.action}
              />
            </View>
            <View style={styles.actions}>
              <Button
                label="Favorites"
                onPress={() => router.push("/favorites")}
                variant="ghost"
                style={styles.action}
              />
              <Button
                label="Sign out"
                onPress={() => setConfirming("customer")}
                variant="ghost"
                style={styles.action}
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Text variant="heading" tone="primary">
              You are browsing as a guest
            </Text>
            <Text variant="caption" tone="muted">
              Sign in to keep a cart across devices and track your orders.
            </Text>
            <Button
              label="Sign in"
              onPress={() => router.push("/login")}
              fullWidth
            />
          </Card>
        )}

        <View style={styles.section}>
          <Text variant="caption" tone="muted">
            Appearance
          </Text>
          <Select
            value={preference}
            options={THEME_OPTIONS}
            onChange={setPreference}
            variant="chips"
          />
        </View>

        <View style={styles.section}>
          <Text variant="caption" tone="muted">
            Staff
          </Text>
          <ListRowGroup>
            {admin && isAdminSession(admin) ? (
              <>
                <ListRowItem
                  label="Open admin console"
                  description={admin.user.email}
                  icon="shield-checkmark"
                  onPress={() => router.push("/admin")}
                />
                <ListRowItem
                  label="Sign out of console"
                  icon="log-out-outline"
                  destructive
                  onPress={() => setConfirming("admin")}
                />
              </>
            ) : (
              <ListRowItem
                label="Staff sign in"
                icon="shield-outline"
                onPress={() => router.push("/admin-login")}
              />
            )}
          </ListRowGroup>
        </View>

        <Text variant="caption" tone="muted" style={styles.note}>
          Sessions are stored in the device keychain. Signing in on the web with
          the same account will sign this device out.
        </Text>
      </ScrollView>

      <ConfirmDialog
        visible={confirming !== null}
        title={confirming === "admin" ? "Sign out of console?" : "Sign out?"}
        message={
          confirming === "admin"
            ? "You will need staff credentials to get back in."
            : "Your cart and orders stay on your account."
        }
        confirmLabel="Sign out"
        destructive
        isPending={false}
        onConfirm={() => {
          if (confirming) void signOutAndReset(confirming);
        }}
        onCancel={() => setConfirming(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  card: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  note: {
    textAlign: "center",
  },
});
