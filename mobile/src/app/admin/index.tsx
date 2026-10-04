import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Screen } from "@/components/layout/Screen";
import { ListRowGroup, ListRowItem } from "@/components/layout/ListRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { ScreenState } from "@/components/ui/ScreenState";
import { Text } from "@/components/ui/Text";
import { listAdminOrders } from "@/lib/api/admin";
import { ORDER_STATUSES } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { spacing } from "@/lib/theme/tokens";
import { useAuthStore } from "@/store/auth";

/**
 * Admin dashboard.
 *
 * There is no stats/metrics endpoint, so the tiles are derived from the first
 * page of orders. `meta.total` is the only exact figure available, so revenue
 * is explicitly labelled as covering the loaded page rather than claiming to be
 * all-time.
 */
export default function AdminDashboardScreen() {
  const admin = useAuthStore((s) => s.admin);

  const orders = useQuery({
    queryKey: queryKeys.admin.orders(1),
    queryFn: () => listAdminOrders(1),
  });

  const stats = useMemo(() => {
    const rows = orders.data?.data ?? [];
    const pageRevenue = rows
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total_amount, 0);
    const pending = rows.filter((order) => order.status === "pending").length;

    return { pageRevenue, pending, loaded: rows.length };
  }, [orders.data]);

  const name = admin?.user?.name?.trim();

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenState isLoading={orders.isLoading} error={orders.error}>
        <>
          <Text variant="heading" tone="primary">
            {name ? `Welcome, ${name}` : "Welcome back"}
          </Text>
          <Text variant="body" tone="muted">
            Signed in with the admin console.
          </Text>

          <View style={styles.tiles}>
            <Card style={styles.tile}>
              <Text variant="caption" tone="muted">
                Orders
              </Text>
              <Text variant="heading" tone="primary">
                {orders.data?.meta.total ?? "—"}
              </Text>
            </Card>

            <Card style={styles.tile}>
              <Text variant="caption" tone="muted">
                Awaiting payment
              </Text>
              <Text variant="heading" tone="primary">
                {stats.pending}
              </Text>
              <Text variant="caption" tone="muted">
                of {stats.loaded} loaded
              </Text>
            </Card>

            <Card style={styles.tile}>
              <Text variant="caption" tone="muted">
                Revenue on this page
              </Text>
              <Text variant="heading" tone="primary">
                <Price amount={stats.pageRevenue} />
              </Text>
              <Text variant="caption" tone="muted">
                excludes cancelled
              </Text>
            </Card>
          </View>

          <View style={styles.actions}>
            <Text variant="bodyStrong">Manage</Text>
            <ListRowGroup>
              <ListRowItem
                label="Orders"
                description="Review, advance status, record payments"
                icon="receipt-outline"
                onPress={() => router.push("/admin/orders")}
              />
              <ListRowItem
                label="Products"
                description="Create, edit, and archive catalogue entries"
                icon="cube-outline"
                onPress={() => router.push("/admin/products")}
              />
              <ListRowItem
                label="Categories"
                description="Maintain the category tree"
                icon="pricetags-outline"
                onPress={() => router.push("/admin/categories")}
              />
            </ListRowGroup>
          </View>

          <Card style={styles.statusCard}>
            <Text variant="bodyStrong">Statuses</Text>
            <Text variant="caption" tone="muted">
              The backend validates only that a status is one of{" "}
              {ORDER_STATUSES.join(", ")} — it does not enforce the sequence, so
              a wrong transition is applied rather than rejected.
            </Text>
          </Card>

          <Button
            label="View orders"
            onPress={() => router.push("/admin/orders")}
            fullWidth
          />
        </>
      </ScreenState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  statusCard: {
    gap: spacing.xs,
  },
});
