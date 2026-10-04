import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/layout/Screen";
import {
  isTerminal,
  NEXT_STATUSES,
  OrderStatusBadge,
} from "@/components/order/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Price } from "@/components/ui/Price";
import { ScreenState } from "@/components/ui/ScreenState";
import { Text } from "@/components/ui/Text";
import {
  getAdminOrder,
  payOrder,
  updateOrderStatus,
} from "@/lib/api/admin";
import {
  formatDateTime,
  formatMoney,
  formatShortId,
  orderStatusLabel,
} from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { spacing } from "@/lib/theme/tokens";
import type { OrderStatus } from "@/lib/types";

/**
 * Admin order review.
 *
 * Status changes and payment recording both write, so each is confirmed and
 * each reports failures inline. Status transitions offered here follow the
 * expected lifecycle, but the backend does not enforce a sequence — see
 * `NEXT_STATUSES`.
 */
export default function AdminOrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  const queryClient = useQueryClient();

  const order = useQuery({
    queryKey: queryKeys.admin.order(id),
    queryFn: () => getAdminOrder(id),
    enabled: Boolean(id),
  });

  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [showPay, setShowPay] = useState(false);
  const [provider, setProvider] = useState("cash");
  const [transactionId, setTransactionId] = useState("");

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id, status),
    onSuccess: async () => {
      setPendingStatus(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.all,
      });
    },
  });

  const payMutation = useMutation({
    mutationFn: () =>
      payOrder(id, {
        provider: provider.trim(),
        ...(transactionId.trim()
          ? { transaction_id: transactionId.trim() }
          : {}),
      }),
    onSuccess: async () => {
      setShowPay(false);
      setTransactionId("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.all,
      });
    },
  });

  const data = order.data?.data;
  const transitions = data ? NEXT_STATUSES[data.status] : [];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenState
        isLoading={order.isLoading}
        error={order.error}
        onRetry={() => void order.refetch()}
      >
        {data ? (
          <>
            <Card style={styles.card}>
              <View style={styles.header}>
                <Text variant="heading" tone="primary">
                  {formatShortId(data.id)}
                </Text>
                <OrderStatusBadge status={data.status} />
              </View>
              <Text variant="caption" tone="muted">
                Placed {formatDateTime(data.created_at)}
              </Text>
              <Price amount={data.total_amount} size="lg" />
            </Card>

            <Card style={styles.card}>
              <Text variant="bodyStrong">Shipping address</Text>
              <Text variant="body" tone="secondary">
                {data.shipping_address}
              </Text>
            </Card>

            {data.items?.length ? (
              <Card style={styles.card}>
                <Text variant="bodyStrong">Items</Text>
                {data.items.map((item) => (
                  <View key={item.id} style={styles.line}>
                    <Text variant="body" tone="secondary" numberOfLines={2}>
                      {item.quantity} × {item.product.title}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {formatMoney(item.line_total)}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {data.payments?.length ? (
              <Card style={styles.card}>
                <Text variant="bodyStrong">Payments</Text>
                {data.payments.map((payment) => (
                  <View key={payment.id} style={styles.line}>
                    <Text variant="caption" tone="secondary">
                      {payment.provider}
                      {payment.transaction_id
                        ? ` · ${payment.transaction_id}`
                        : ""}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {payment.status} · {formatMoney(payment.amount)}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}

            <Card style={styles.card}>
              <Text variant="bodyStrong">Actions</Text>

              {transitions.length === 0 ? (
                <Text variant="caption" tone="muted">
                  {orderStatusLabel(data.status)} is final — no further
                  transitions are offered.
                </Text>
              ) : (
                transitions.map((next) => (
                  <Button
                    key={next}
                    label={`Mark ${orderStatusLabel(next)}`}
                    variant={next === "cancelled" ? "danger" : "secondary"}
                    loading={statusMutation.isPending}
                    disabled={statusMutation.isPending}
                    onPress={() => setPendingStatus(next)}
                  />
                ))
              )}

              {isTerminal(data.status) ? null : (
                <Button
                  label="Record payment"
                  variant="ghost"
                  onPress={() => setShowPay(true)}
                />
              )}
            </Card>
          </>
        ) : null}
      </ScreenState>

      <ConfirmDialog
        visible={pendingStatus !== null}
        title="Change order status"
        message={
          pendingStatus
            ? `Move this order to ${orderStatusLabel(
                pendingStatus
              ).toLowerCase()}? This writes immediately.`
            : ""
        }
        confirmLabel="Change status"
        destructive={pendingStatus === "cancelled"}
        isPending={statusMutation.isPending}
        error={statusMutation.error}
        onConfirm={() => {
          if (pendingStatus) statusMutation.mutate(pendingStatus);
        }}
        onCancel={() => setPendingStatus(null)}
      />

      <ConfirmDialog
        visible={showPay}
        title="Record payment"
        message="This writes a payment row against the order."
        confirmLabel="Save payment"
        isPending={payMutation.isPending}
        error={payMutation.error}
        onConfirm={() => payMutation.mutate()}
        onCancel={() => setShowPay(false)}
      >
        <View style={styles.payForm}>
          <Input
            label="Provider"
            value={provider}
            onChangeText={setProvider}
            placeholder="cash"
            autoCapitalize="none"
            containerStyle={styles.field}
          />
          <Input
            label="Transaction ID (optional)"
            value={transactionId}
            onChangeText={setTransactionId}
            placeholder="receipt or reference number"
            autoCapitalize="none"
          />
        </View>
      </ConfirmDialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
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
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  payForm: {
    gap: spacing.md,
  },
  field: {
    marginBottom: spacing.sm,
  },
});
