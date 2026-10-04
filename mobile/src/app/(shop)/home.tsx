import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { GRID_COLUMNS, gridCell, gridListPadding } from "@/components/product/grid";
import { SortMenu } from "@/components/product/SortMenu";
import { ScreenState } from "@/components/ui/ScreenState";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { Text } from "@/components/ui/Text";
import { ThemeToggleButton } from "@/components/ui/ThemeToggleButton";
import { useCategoriesFlat } from "@/hooks/use-categories";
import { flattenProducts, useProducts } from "@/hooks/use-products";
import { useTheme } from "@/hooks/use-theme";
import type { ListProductsParams, ProductSort } from "@/lib/types";
import { radius, spacing } from "@/lib/theme/tokens";

/**
 * Storefront landing screen.
 *
 * The API filters by comma-joined category **slugs**, so the selected chips are
 * joined into a single query value. Selecting nothing clears the filter rather
 * than sending an empty string, which the backend treats as "no filter" anyway.
 */
export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [sort, setSort] = useState<ProductSort>("newest");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const categories = useCategoriesFlat();

  const params: ListProductsParams = {
    sort,
    categories: selectedSlugs.length ? selectedSlugs.join(",") : undefined,
  };

  const feed = useProducts(params);
  const products = flattenProducts(feed.data?.pages);

  const loadMore = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed]);

  const toggleSlug = (slug: string) =>
    setSelectedSlugs((current) =>
      current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug]
    );

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
      <ScreenHeader
        title="El Joker"
        subtitle="byta3 kol 7aga"
        action={<ThemeToggleButton />}
      />

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search products"
        onPress={() => router.push("/search")}
        style={({ pressed }) => [
          styles.searchField,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <Text variant="body" tone="muted" style={styles.searchLabel}>
          Search products
        </Text>
      </Pressable>

      {categories.data && categories.data.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScrollView}
          contentContainerStyle={styles.chipRow}
        >
          <Chip
            label="All"
            active={selectedSlugs.length === 0}
            onPress={() => setSelectedSlugs([])}
          />
          {categories.data.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              count={category.products_count}
              active={selectedSlugs.includes(category.slug)}
              onPress={() => toggleSlug(category.slug)}
            />
          ))}
        </ScrollView>
      ) : null}

      <ScreenState
        isLoading={feed.isLoading}
        error={feed.error}
        isEmpty={products.length === 0}
        onRetry={() => void feed.refetch()}
        loadingFallback={skeleton}
        emptyTitle="Nothing matches"
        emptyMessage="Try clearing a filter, or check back once the shop is stocked."
        emptyActionLabel={selectedSlugs.length ? "Clear filters" : undefined}
        onEmptyAction={() => setSelectedSlugs([])}
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
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.metaRow}>
              <Text variant="caption" tone="muted">
                {products.length} product{products.length === 1 ? "" : "s"}
              </Text>
              <SortMenu value={sort} onChange={setSort} />
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

function Chip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
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
        {typeof count === "number" && count > 0 ? `${label} (${count})` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchLabel: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  categoriesScrollView: {
    flexGrow: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
});
