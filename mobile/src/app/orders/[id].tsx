import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/layout/Screen";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormBanner } from "@/components/ui/FormBanner";
import { Price } from "@/components/ui/Price";
import { ScreenState } from "@/components/ui/ScreenState";
import { Text } from "@/components/ui/Text";
import {
  downloadInvoicePdfBytes,
  getInvoiceLink,
  getOrder,
} from "@/lib/api/orders";
import { formatDateTime, formatMoney, formatShortId } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { spacing } from "@/lib/theme/tokens";

/**
 * Order detail with invoice sharing.
 *
 * The signed-link endpoint is tried first because it hands the OS a URL with no
 * bearer token attached. It fails on the default `local` invoice disk, where
 * `temporaryUrl()` is unsupported, so the authenticated-bytes path is the
 * fallback and the one that actually works in local development.
 */
export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  const [share, setShare] = useState<
    { kind: "idle" } | { kind: "working" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  const order = useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => getOrder(id),
    enabled: Boolean(id),
    select: (res) => res.data,
  });

  const data = order.data;
  const busy = share.kind === "working";

  const shareInvoice = async () => {
    setShare({ kind: "working" });
    try {
      try {
        const link = await getInvoiceLink(id);
        if (link.url) {
          await Sharing.shareAsync(link.url);
          setShare({ kind: "idle" });
          return;
        }
      } catch {
        // Signed links are unavailable on the local invoice disk; fall through.
      }

      const bytes = await downloadInvoicePdfBytes(id);
      const file = new File(Paths.cache, `invoice-${id}.pdf`);
      file.create({ overwrite: true });
      file.write(bytes);
      await Sharing.shareAsync(file.uri);
      setShare({ kind: "idle" });
    } catch (error) {
      setShare({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not share the invoice. Please try again.",
      });
    }
  };

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

            {data.invoice ? (
              <Card style={styles.card}>
                <Text variant="bodyStrong">Invoice</Text>
                <Text variant="caption" tone="muted">
                  {data.invoice.invoice_number} · issued{" "}
                  {formatDateTime(data.invoice.issued_at)}
                </Text>
                <Button
                  label="Share invoice PDF"
                  variant="secondary"
                  onPress={() => void shareInvoice()}
                  loading={busy}
                  disabled={busy}
                  accessibilityHint="Opens the system share sheet with the PDF"
                />
              </Card>
            ) : null}

            {share.kind === "error" ? (
              <FormBanner message={share.message} />
            ) : null}
          </>
        ) : null}
      </ScreenState>
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
});
