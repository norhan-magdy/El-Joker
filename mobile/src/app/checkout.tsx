import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormBanner } from "@/components/ui/FormBanner";
import { Price } from "@/components/ui/Price";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { ScreenState } from "@/components/ui/ScreenState";
import { Text } from "@/components/ui/Text";
import { Textarea } from "@/components/ui/Textarea";
import { useCart } from "@/hooks/use-cart";
import { errorMessage, isRateLimited, stockAvailable } from "@/lib/api/errors";
import { checkout } from "@/lib/api/orders";
import { applyServerErrors } from "@/lib/forms";
import { CHECKOUT_ADDRESS_MAX } from "@/lib/config";
import { checkoutSchema, type CheckoutValues } from "@/lib/schemas";
import { getLastAddress, setLastAddress } from "@/lib/storage";
import { spacing } from "@/lib/theme/tokens";

/**
 * Checkout.
 *
 * The API takes a single free-text `shipping_address` with no address book, so
 * the last successful value is cached locally purely to save retyping. It is a
 * convenience only — checkout never trusts it for anything but prefill.
 */
export default function CheckoutScreen() {
  const queryClient = useQueryClient();
  const cart = useCart();

  const [formError, setFormError] = useState<unknown>(null);
  const [stockConflict, setStockConflict] = useState<string | null>(null);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { shipping_address: "" },
    mode: "onBlur",
  });

  // Prefill once on mount. Reading storage during render would flash an empty
  // field, and doing it on blur would yank text out from under a user mid-edit.
  useEffect(() => {
    let active = true;
    void getLastAddress().then((remembered) => {
      if (active && remembered) form.setValue("shipping_address", remembered);
    });
    return () => {
      active = false;
    };
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setStockConflict(null);

    const address = values.shipping_address.trim();

    try {
      const res = await checkout({ shipping_address: address });
      await setLastAddress(address);
      // Checkout empties the cart server-side, so both cart keys are now stale
      // and the whole cache is dropped to be sure no other cart view lingers.
      queryClient.clear();
      router.replace({ pathname: "/orders/[id]", params: { id: res.data.id } });
    } catch (error) {
      const available = stockAvailable(error);
      if (available !== null) {
        setStockConflict(
          `Some items sold out while you were deciding — only ${available} left. Your cart is unchanged.`
        );
        void cart.query.refetch();
        return;
      }
      if (!applyServerErrors(form.setError, error)) setFormError(error);
    }
  });

  return (
    <Screen
      scroll
      bottomInset={96}
      contentContainerStyle={[styles.content, { gap: spacing.lg }]}
    >
      <Card style={styles.card}>
        <Text variant="heading" tone="primary">
          Order summary
        </Text>

        <ScreenState
          isLoading={cart.query.isLoading}
          error={cart.query.error}
          onRetry={() => void cart.query.refetch()}
          loadingFallback={
            <View style={styles.lines}>
              <RowSkeleton />
              <RowSkeleton />
            </View>
          }
        >
          <View style={styles.lines}>
            {cart.items.map((item) => (
              <View key={item.id} style={styles.line}>
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {item.quantity} × {item.product.title}
                </Text>
                <Price amount={item.line_total} size="sm" />
              </View>
            ))}
          </View>
        </ScreenState>

        <View style={[styles.line, styles.totalLine]}>
          <Text variant="bodyStrong">Total</Text>
          <Price amount={cart.subtotal} />
        </View>
      </Card>

      {stockConflict ? <FormBanner message={stockConflict} tone="warning" /> : null}

      {formError ? (
        <FormBanner message={errorMessage(formError)} tone="error" />
      ) : null}

      <Controller
        control={form.control}
        name="shipping_address"
        render={({ field, fieldState }) => (
          <Textarea
            label="Shipping address"
            hint="A full address helps the courier reach you. Include a phone number if you have one."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            maxLength={CHECKOUT_ADDRESS_MAX}
            autoCapitalize="sentences"
            autoCorrect
            multiline
          />
        )}
      />

      <View style={styles.footer}>
        <Button
          label={isRateLimited(formError) ? "Too many attempts" : "Place order"}
          onPress={onSubmit}
          loading={form.formState.isSubmitting}
          disabled={
            isRateLimited(formError) ||
            cart.count === 0 ||
            cart.isMutating ||
            form.formState.isSubmitting
          }
          fullWidth
          accessibilityHint="Submits the order and empties your cart"
        />
        <Text variant="caption" tone="muted" style={styles.note}>
          Payment is arranged after you order. Orders can be cancelled by staff
          while they are still pending.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  lines: {
    gap: spacing.sm,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  totalLine: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  footer: {
    gap: spacing.sm,
  },
  note: {
    textAlign: "center",
  },
});
