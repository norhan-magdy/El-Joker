import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { addCartItem } from "@/lib/api/cart";
import { errorMessage, stockAvailable } from "@/lib/api/errors";
import { canAddToCart } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { spacing } from "@/lib/theme/tokens";

type Props = {
  productId: string;
  quantity?: number;
  /** Omitted when the API did not eager-load inventory. */
  stock?: number;
  disabled?: boolean;
  /** Lets a row layout give the button a definite width. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Add-to-cart action for a product card or detail screen.
 *
 * The 409 stock conflict is surfaced inline with the server's own `available`
 * figure instead of a generic failure, because the shopper's next move is
 * always "lower the quantity to N". The cart queries are invalidated on success
 * so the header badge and cart screen stay consistent with the server.
 *
 * The failure text sits *above* the button: in the product footer this lives in
 * a row next to the total, and a message underneath the button is squeezed into
 * an unreadable sliver that reads as "nothing happened".
 */
export function AddToCartButton({
  productId,
  quantity = 1,
  stock,
  disabled = false,
  style,
}: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const soldOut = !canAddToCart(stock);
  const inert = disabled || soldOut;

  const mutation = useMutation({
    mutationFn: () => addCartItem({ product_id: productId, quantity }),
    onMutate: () => setError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
    onError: (err) => {
      const available = stockAvailable(err);
      setError(
        available === null
          ? errorMessage(err)
          : `Only ${available} left in stock.`
      );
    },
  });

  return (
    <View style={[styles.wrap, style]}>
      {error ? (
        <Text variant="caption" tone="error" numberOfLines={2}>
          {error}
        </Text>
      ) : null}

      <Button
        label={soldOut ? "Out of stock" : "Add to cart"}
        onPress={() => mutation.mutate()}
        disabled={inert}
        loading={mutation.isPending}
        fullWidth
        accessibilityHint={
          soldOut ? undefined : "Adds this product to your cart"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
});
