import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "@/components/layout/Screen";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { Price } from "@/components/ui/Price";
import { ScreenState } from "@/components/ui/ScreenState";
import { Select } from "@/components/ui/Select";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { listOrders } from "@/lib/api/orders";
import { formatDate, formatShortId, ORDER_STATUSES } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { spacing } from "@/lib/theme/tokens";
import type { Order, OrderStatus } from "@/lib/types";

/**
 * Customer order history.
 *
 * Paged rather than infinite-scrolled: orders are sparse, bounded, and a
 * shopper looking for one specific order benefits from being able to jump
 * between numbered pages. `page` is mirrored into the URL so a given page can be
 * linked to and survives a reload.
 */
export default function OrdersScreen() {
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | null>(null);

  const orders = useQuery({
    queryKey: queryKeys.orders.list(page, status ?? undefined),
    queryFn: () => listOrders(page),
  });

// `meta` is needed for the pager, so the whole page is kept rather than
  // selecting just the array.
  const result = orders.data;
  const lastPage = result?.meta.last_page ?? 1;
  const total = result?.meta.total;

  /**
   * The list endpoint takes no status filter, so a status selection narrows the
   * fetched page client-side. That is honest about what the API offers instead
   * of sending a parameter it would silently ignore.
   */
  const visible = status === null
    ? (result?.data ?? [])
    : (result?.data ?? []).filter((order) => order.status === status);

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
        emptyTitle="No orders yet"
        emptyMessage="Once you place an order it will show up here."
        emptyActionLabel="Go to shop"
        onEmptyAction={() => router.push("/home")}
      >
        <FlashList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderRow order={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
            gap: spacing.md,
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Pagination
              page={page}
              totalPages={lastPage}
              totalItems={total}
              onChange={setPage}
              disabled={orders.isFetching}
            />
          }
        />
      </ScreenState>
    </Screen>
  );
}

export function OrderRow({ order }: { order: Order }) {
  const { colors } = useTheme();
  const itemCount = order.items?.reduce((n, i) => n + i.quantity, 0) ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${formatShortId(order.id)}`}
      accessibilityHint="Opens the order details"
      onPress={() => router.push(`/orders/${order.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Card style={[styles.card, { borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text variant="bodyStrong" tone="primary">
            {formatShortId(order.id)}
          </Text>
          <OrderStatusBadge status={order.status} />
        </View>

        <Text variant="caption" tone="muted">
          {formatDate(order.created_at)}
          {itemCount > 0 ? ` · ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}
        </Text>

        <Price amount={order.total_amount} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  lines: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
});
