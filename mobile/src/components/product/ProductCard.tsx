import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";

import { Badge } from "@/components/ui/Badge";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Price } from "@/components/ui/Price";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { stockState } from "@/lib/format";
import type { Product } from "@/lib/types";
import { fontSize, radius, shadow, spacing } from "@/lib/theme/tokens";

type Props = {
  product: Product;
};

/**
 * Catalogue tile.
 *
 * Structure mirrors `frontend/components/catalog/ProductCard.tsx`: square media,
 * muted category, two-line title, price pinned to the bottom, and availability
 * as a pill over the image.
 *
 * The card stretches to the full cell height because FlashList forces every
 * item in a row to the tallest one's height — without `flex: 1` the price of a
 * short-titled product floats mid-card and a row ends up with two different
 * baselines.
 *
 * Memoised because catalogue grids re-render on every keystroke in the search
 * box; the card itself is presentational and depends only on its product.
 */
export const ProductCard = memo(function ProductCard({ product }: Props) {
  const { colors } = useTheme();

  /**
   * Only the states that change what a shopper would do get a pill. "In stock"
   * on every tile is noise, and an absent `stock` (the resource did not
   * eager-load inventory) must never read as available — the detail screen is
   * where an unknown quantity gets resolved.
   */
  const availability = stockState(product.stock);
  const pill =
    availability.kind === "out" ? (
      <Badge label="Out of stock" tone="error" />
    ) : availability.kind === "low" ? (
      <Badge label={`Only ${availability.remaining} left`} tone="warning" />
    ) : null;

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={product.title}
        accessibilityHint={
          product.is_active ? "View details" : "Inactive product. View details"
        }
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.textPrimary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.media}>
          <ImageWithFallback
            uri={product.image_url}
            ratio={1}
            radiusOverride={0}
            style={styles.image}
            accessibilityLabel={product.title}
          />

          {pill ? (
            <View style={styles.pill} pointerEvents="none">
              {pill}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {product.category ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {product.category.name}
            </Text>
          ) : null}

          <Text variant="bodyStrong" numberOfLines={2} style={styles.title}>
            {product.title}
          </Text>

          <View style={styles.footer}>
            <Price amount={product.price} size="md" />
          </View>
        </View>
      </Pressable>
    </Link>
  );
});

const styles = StyleSheet.create({
  card: {
    // Fills the cell so a row of tiles shares one bottom edge.
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: shadow.offset,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
    elevation: shadow.elevation,
  },
  media: {
    width: "100%",
  },
  image: {
    borderRadius: 0,
  },
  pill: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    maxWidth: "90%",
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  title: {
    // Two lines are reserved so the footer sits on a shared baseline whether
    // the title wraps or not.
    minHeight: fontSize.md * 1.45 * 2,
  },
  footer: {
    marginTop: "auto",
    paddingTop: spacing.xs,
  },
});
