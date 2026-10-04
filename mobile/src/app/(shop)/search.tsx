import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/product/ProductCard";
import { GRID_COLUMNS, gridCell, gridListPadding } from "@/components/product/grid";
import { SortMenu } from "@/components/product/SortMenu";
import { Input } from "@/components/ui/Input";
import { ScreenState } from "@/components/ui/ScreenState";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { Text } from "@/components/ui/Text";
import { useAllCategories, buildCategoryTree } from "@/hooks/use-categories";
import { flattenProducts, useProducts } from "@/hooks/use-products";
import { useTheme } from "@/hooks/use-theme";
import type { ListProductsParams, ProductSort } from "@/lib/types";
import { radius, spacing } from "@/lib/theme/tokens";

const DEBOUNCE_MS = 350;

/**
 * Catalogue search with the full filter set.
 *
 * The query text is debounced locally rather than fetched per keystroke, and the
 * filter state is keyed into the query key so changing a filter always hits the
 * first page instead of appending to the previous result set.
 */
export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProductSort>("newest");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text]);

  const categories = useAllCategories();
  const tree = buildCategoryTree(categories.data ?? []);

  const params: ListProductsParams = {
    q: query || undefined,
    sort,
    categories: selectedSlugs.length ? selectedSlugs.join(",") : undefined,
    inStock: inStockOnly || undefined,
  };

  const feed = useProducts(params);
  const products = flattenProducts(feed.data?.pages);
  const priceRange = feed.data?.pages[0]?.price_range;

  const loadMore = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed]);

  const activeFilterCount =
    selectedSlugs.length +
    (inStockOnly ? 1 : 0) +
    (sort !== "newest" ? 1 : 0);

  const reset = () => {
    setSelectedSlugs([]);
    setInStockOnly(false);
    setSort("newest");
  };

  const skeleton = (
    <View style={[gridCell.row, { paddingHorizontal: gridListPadding }]}>
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} style={gridCell.cell}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Input
          placeholder="Search products"
          value={text}
          onChangeText={setText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search products"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip
            label={inStockOnly ? "In stock only" : "Any availability"}
            active={inStockOnly}
            onPress={() => setInStockOnly((v) => !v)}
          />
          {tree.map(({ category, depth }) => (
            <Chip
              key={category.id}
              label={`${"· ".repeat(depth)}${category.name}`}
              active={selectedSlugs.includes(category.slug)}
              onPress={() =>
                setSelectedSlugs((current) =>
                  current.includes(category.slug)
                    ? current.filter((s) => s !== category.slug)
                    : [...current, category.slug]
                )
              }
            />
          ))}
        </ScrollView>
      </View>

      <ScreenState
        isLoading={feed.isLoading}
        error={feed.error}
        isEmpty={products.length === 0}
        onRetry={() => void feed.refetch()}
        loadingFallback={skeleton}
        emptyTitle={query ? `No matches for “${query}”` : "No products match"}
        emptyMessage="Adjust the filters or search for something else."
        emptyActionLabel={activeFilterCount ? "Clear filters" : undefined}
        onEmptyAction={reset}
      >
        <FlashList
          data={products}
          numColumns={GRID_COLUMNS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={gridCell.cell}>
              <ProductCard product={item} />
            </View>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          contentContainerStyle={{
            paddingHorizontal: gridListPadding,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <View style={styles.metaRow}>
              <Text variant="caption" tone="muted" style={styles.metaText}>
                {products.length} shown
                {priceRange
                  ? ` · ${formatRange(priceRange.min, priceRange.max)}`
                  : ""}
              </Text>

              <View style={styles.metaActions}>
                <SortMenu value={sort} onChange={setSort} />
                {activeFilterCount > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear filters"
                    onPress={reset}
                    hitSlop={8}
                  >
                    <Text variant="caption" tone="primaryBrand">
                      Clear
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          }
          ListFooterComponent={
            feed.isFetchingNextPage ? <Spinner label="Loading more" /> : null
          }
        />
      </ScreenState>
    </View>
  );
}

function formatRange(min: number, max: number): string {
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return `${money.format(min)} – ${money.format(max)}`;
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label.trim()}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        variant="caption"
        numberOfLines={1}
        style={{ color: active ? colors.onPrimary : colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  metaText: {
    flexShrink: 1,
  },
  metaActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
