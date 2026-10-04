import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "@/components/layout/Screen";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { Price } from "@/components/ui/Price";
import { ScreenState } from "@/components/ui/ScreenState";
import { Select } from "@/components/ui/Select";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { listAdminOrders } from "@/lib/api/admin";
import { formatDate, formatShortId, ORDER_STATUSES } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { spacing } from "@/lib/theme/tokens";
import type { Order, OrderStatus } from "@/lib/types";

/**
 * Admin order queue, newest first.
 *
 * The admin list endpoint takes no status filter, so choosing a status narrows
 * the current page client-side. Sending an unsupported query parameter would be
 * ignored by Laravel anyway and would misrepresent the result set.
 */
export default function AdminOrdersScreen() {
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | null>(null);

  const orders = useQuery({
    queryKey: queryKeys.admin.orders(page),
    queryFn: () => listAdminOrders(page),
  });

  const rows = orders.data?.data ?? [];
  const visible = status === null
    ? rows
    : rows.filter((order) => order.status === status);

  const filtering = status !== null;

  return (
    <Screen padded={false}>
      <View style={styles.filter}>
        <Select
          label="Status"
          value={status}
          placeholder="All statuses"
          options={ORDER_STATUSES}
          onChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
        />
        {filtering ? (
          <Text variant="caption" tone="muted">
            Filtering the loaded page only — the endpoint has no status filter, so
            matching orders on other pages are not shown.
          </Text>
        ) : null}
      </View>

      <ScreenState
        isLoading={orders.isLoading}
        error={orders.error}
        isEmpty={visible.length === 0}
        onRetry={() => void orders.refetch()}
        loadingFallback={
          <View style={styles.lines}>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </View>
        }
        emptyTitle={filtering ? "No match on this page" : "No orders yet"}
        emptyMessage={
          filtering
            ? "Try clearing the filter or moving to another page."
            : "Orders will appear here as customers check out."
        }
      >
        <FlashList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AdminOrderRow order={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
            gap: spacing.md,
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Pagination
              page={page}
              totalPages={orders.data?.meta.last_page ?? 1}
              totalItems={orders.data?.meta.total}
              onChange={setPage}
              disabled={orders.isFetching}
            />
          }
        />
      </ScreenState>
    </Screen>
  );
}

function AdminOrderRow({ order }: { order: Order }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${formatShortId(order.id)}`}
      accessibilityHint="Opens the order to review status and payments"
      onPress={() => router.push(`/admin/orders/${order.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text variant="bodyStrong" tone="primary">
            {formatShortId(order.id)}
          </Text>
          <OrderStatusBadge status={order.status} />
        </View>

        <Text variant="caption" tone="muted">
          {formatDate(order.created_at)}
        </Text>

        <Text variant="caption" tone="secondary" numberOfLines={2}>
          {order.shipping_address}
        </Text>

        <View style={styles.footer}>
          <Price amount={order.total_amount} />
          <Button
            label="Review"
            variant="ghost"
            size="sm"
            onPress={() => router.push(`/admin/orders/${order.id}`)}
          />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  lines: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
});
