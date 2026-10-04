import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "@/components/layout/Screen";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormBanner } from "@/components/ui/FormBanner";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Price } from "@/components/ui/Price";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { ScreenState } from "@/components/ui/ScreenState";
import { StockBadge } from "@/components/ui/StockBadge";
import { Text } from "@/components/ui/Text";
import { addFavorite, listFavorites, removeFavorite } from "@/lib/api/cart";
import { getProduct } from "@/lib/api/catalog";
import { canAddToCart, clampQuantity, stockLabel } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { radius, spacing } from "@/lib/theme/tokens";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/auth";

/**
 * Product detail.
 *
 * Stock is re-read from this screen's own payload rather than trusted from the
 * grid the user tapped through, because a list can be minutes stale. The server
 * still owns the limit: a 409 here downgrades the stepper instead of blocking
 * the add outright.
 */
export default function ProductDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const customer = useAuthStore((s) => s.customer);

  const [quantity, setQuantity] = useState(1);
  const [favouritePending, setFavouritePending] = useState(false);
  const [confirmFavourite, setConfirmFavourite] = useState(false);

  const product = useQuery({
    queryKey: queryKeys.catalog.product(id ?? ""),
    queryFn: () => getProduct(id as string),
    enabled: Boolean(id),
    select: (res) => res.data,
  });

  const favorites = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: listFavorites,
    enabled: Boolean(customer),
    select: (res) => res.data,
  });

  const isFavorite =
    Boolean(id) && (favorites.data ?? []).some((p) => p.id === id);

  const toggleFavorite = useMutation({
    mutationFn: () =>
      isFavorite ? removeFavorite(id as string) : addFavorite(id as string),
    onMutate: () => setFavouritePending(true),
    onSettled: () => {
      setFavouritePending(false);
      setConfirmFavourite(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  const data = product.data;
  const purchasable = data ? data.is_active && canAddToCart(data.stock) : false;

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: data?.title ?? "Product" }} />

      <ScreenState
        isLoading={product.isLoading}
        error={product.error}
        onRetry={() => void product.refetch()}
      >
        {data ? (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + 120 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <ImageWithFallback
              uri={data.image_url}
              ratio={1}
              radiusOverride={0}
              accessibilityLabel={data.title}
            />

            <View style={styles.block}>
              {data.category ? (
                <Badge label={data.category.name} tone="brand" />
              ) : null}

              <Text variant="title" tone="primary">
                {data.title}
              </Text>

              <View style={styles.priceRow}>
                <Price amount={data.price} size="lg" />
                <StockBadge stock={data.stock} />
              </View>

              {!data.is_active ? (
                <FormBanner
                  message="This product is inactive and cannot be ordered."
                  tone="warning"
                />
              ) : null}

              {data.is_active ? (
                <Text variant="caption" tone="muted">
                  {stockLabel(data.stock)}
                </Text>
              ) : null}
            </View>

            {data.description ? (
              <Card style={styles.block}>
                <Text variant="body" tone="secondary">
                  {data.description}
                </Text>
              </Card>
            ) : null}

            {purchasable ? (
              <View style={styles.block}>
                <Text variant="caption" tone="muted">
                  Quantity
                </Text>
                <View style={styles.quantityRow}>
                  <QuantityStepper
                    value={quantity}
                    stock={data.stock}
                    onChange={setQuantity}
                  />
                </View>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isFavorite ? "Remove from favorites" : "Save to favorites"
              }
              onPress={() => {
                if (!customer) {
                  router.push("/login");
                  return;
                }
                if (isFavorite) {
                  void toggleFavorite.mutate();
                } else {
                  setConfirmFavourite(true);
                }
              }}
              disabled={favouritePending}
              style={({ pressed }) => [
                styles.favorite,
                {
                  borderColor: colors.border,
                  opacity: favouritePending ? 0.5 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={18}
                color={isFavorite ? colors.primary : colors.textSecondary}
              />
              <Text variant="body" tone="secondary">
                {customer
                  ? isFavorite
                    ? "Saved to favorites"
                    : "Save to favorites"
                  : "Sign in to save favorites"}
              </Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </ScreenState>

      {purchasable ? (
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
          <Price amount={data ? data.price * quantity : 0} />
          <AddToCartButton
            productId={data?.id ?? ""}
            quantity={clampQuantity(quantity, data?.stock)}
            stock={data?.stock}
            style={styles.footerAction}
          />
        </View>
      ) : null}

      <ConfirmDialog
        visible={confirmFavourite}
        title="Save to favorites?"
        message="You can find saved products again from your account."
        confirmLabel="Save"
        isPending={favouritePending}
        error={toggleFavorite.error}
        onConfirm={() => toggleFavorite.mutate()}
        onCancel={() => setConfirmFavourite(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  block: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  quantityRow: {
    alignItems: "flex-start",
  },
  favorite: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  footerAction: {
    // The button is `fullWidth`, which only resolves against a parent with a
    // definite width — in this row it has to come from the flex layout.
    flex: 1,
  },
});
