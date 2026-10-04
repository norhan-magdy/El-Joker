import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormBanner } from "@/components/ui/FormBanner";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Price } from "@/components/ui/Price";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { ScreenState } from "@/components/ui/ScreenState";
import { StockBadge } from "@/components/ui/StockBadge";
import { Text } from "@/components/ui/Text";
import { useCart } from "@/hooks/use-cart";
import { useTheme } from "@/hooks/use-theme";
import { errorMessage, stockAvailable } from "@/lib/api/errors";
import { maxSelectable } from "@/lib/format";
import { radius, spacing } from "@/lib/theme/tokens";
import type { CartItem } from "@/lib/types";

export default function CartScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cart = useCart();

  const [pendingRemoval, setPendingRemoval] = useState<CartItem | null>(null);
  const [lineError, setLineError] = useState<string | null>(null);

  /**
   * Writes the new quantity straight to the server. A 409 means the cached stock
   * was optimistic, so the message quotes the server's own `available` value and
   * the refetch pulls the corrected number into the stepper.
   */
  const setQuantity = (item: CartItem, quantity: number) => {
    setLineError(null);
    cart.update.mutate(
      { id: item.id, quantity },
      {
        onError: (error) => {
          const available = stockAvailable(error);
          setLineError(
            available === null
              ? errorMessage(error)
              : `Only ${available} available right now.`
          );
        },
      }
    );
  };

  return (
    <Screen padded={false}>
      <ScreenState
        isLoading={cart.query.isLoading}
        error={cart.query.error}
        isEmpty={cart.count === 0}
        onRetry={() => void cart.query.refetch()}
        emptyTitle="Your cart is empty"
        emptyMessage="Browse the shop to add something you like."
        emptyActionLabel="Go to shop"
        onEmptyAction={() => router.push("/home")}
      >
        <FlashList
          data={cart.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const ceiling = maxSelectable(item.product.stock);

            return (
              <View style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.product.title}
                  onPress={() => router.push(`/product/${item.product.id}`)}
                  style={styles.thumbWrapper}
                >
                  <ImageWithFallback
                    uri={item.product.image_url}
                    ratio={1}
                    radiusOverride={radius.md}
                    accessibilityLabel={item.product.title}
                  />
                </Pressable>

                <View style={styles.details}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.product.title}
                    onPress={() => router.push(`/product/${item.product.id}`)}
                  >
                    <Text variant="bodyStrong" numberOfLines={2}>
                      {item.product.title}
                    </Text>
                  </Pressable>

                  <StockBadge stock={item.product.stock} />

                  <View style={styles.rowFooter}>
                    <QuantityStepper
                      value={item.quantity}
                      stock={item.product.stock}
                      onChange={(quantity) => setQuantity(item, quantity)}
                      disabled={cart.isMutating}
                    />
                    <Price amount={item.line_total} />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.product.title} from cart`}
                    onPress={() => setPendingRemoval(item)}
                    hitSlop={8}
                    style={styles.remove}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.error} />
                    <Text variant="caption" tone="error">
                      Remove
                    </Text>
                  </Pressable>

                  {ceiling === 0 ? (
                    <Text variant="caption" tone="error">
                      This item is now out of stock. Remove it to continue.
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: insets.bottom + 140,
            gap: spacing.md,
          }}
          showsVerticalScrollIndicator={false}
        />

        {lineError ? (
          <View style={styles.errorSlot}>
            <FormBanner message={lineError} />
          </View>
        ) : null}

        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + spacing.md,
              borderTopColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <View style={styles.totalRow}>
            <Text variant="caption" tone="muted">
              {cart.quantity} item{cart.quantity === 1 ? "" : "s"}
            </Text>
            <Price amount={cart.subtotal} size="lg" />
          </View>
          <Button
            label="Checkout"
            onPress={() => router.push("/checkout")}
            fullWidth
          />
        </View>
      </ScreenState>

      <ConfirmDialog
        visible={pendingRemoval !== null}
        title="Remove from cart?"
        message={
          pendingRemoval
            ? `“${pendingRemoval.product.title}” will be removed from your cart.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        isPending={cart.remove.isPending}
        error={cart.remove.error}
        onConfirm={() => {
          if (pendingRemoval) cart.remove.mutate(pendingRemoval.id);
          setPendingRemoval(null);
        }}
        onCancel={() => setPendingRemoval(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  thumbWrapper: {
    width: 84,
  },
  details: {
    flex: 1,
    gap: spacing.sm,
  },
  rowFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  remove: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  errorSlot: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
