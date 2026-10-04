import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "@/components/layout/Screen";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Input } from "@/components/ui/Input";
import { ListSeparator } from "@/components/ui/ListSeparator";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { Price } from "@/components/ui/Price";
import { ScreenState } from "@/components/ui/ScreenState";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { StockBadge } from "@/components/ui/StockBadge";
import { Text } from "@/components/ui/Text";
import { deleteProduct, listProducts } from "@/lib/api/catalog";
import { queryKeys } from "@/lib/query-keys";
import { radius, spacing } from "@/lib/theme/tokens";
import type { Product } from "@/lib/types";

/**
 * Admin product list.
 *
 * The admin scope reuses the public catalogue endpoint, which paginates and
 * supports `q` but exposes no separate admin-only listing. Rows are therefore
 * full-width rather than a grid, because the admin surface needs the slug,
 * stock, and active state side by side.
 *
 * The scope is sent as `admin` on purpose. `index` only returns inactive
 * products when the caller holds `products.manage`, so a public read silently
 * drops every hidden product from this list — the ones that most need editing.
 */
export default function AdminProductsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const products = useQuery({
    queryKey: queryKeys.catalog.products({
      page,
      search: query || undefined,
      scope: "admin",
    }),
    queryFn: () =>
      listProducts({ page, q: query || undefined }, "admin"),
  });

  const remove = useMutation({
    mutationFn: (product: Product) => deleteProduct(product.id),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
    },
  });

  const rows = products.data?.data ?? [];

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Input
          value={term}
          onChangeText={setTerm}
          onSubmitEditing={() => {
            setPage(1);
            setQuery(term.trim());
          }}
          returnKeyType="search"
          placeholder="Search products"
          containerStyle={styles.search}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create product"
          onPress={() => router.push("/admin/products/form")}
          style={({ pressed }) => [
            styles.add,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text variant="bodyStrong" tone="primary">
            New
          </Text>
        </Pressable>
      </View>

      <ScreenState
        isLoading={products.isLoading}
        error={products.error}
        isEmpty={rows.length === 0}
        onRetry={() => void products.refetch()}
        loadingFallback={
          // This list renders full-width rows, so it loads into row skeletons
          // rather than the catalogue's two-up card skeleton.
          <View style={styles.skeletons}>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </View>
        }
        emptyTitle={query ? "No matches" : "No products yet"}
        emptyMessage={
          query
            ? "Try a different search term."
            : "Create the first product to populate the catalogue."
        }
      >
        <FlashList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              onEdit={() =>
                router.push({
                  pathname: "/admin/products/form",
                  params: { id: item.id },
                })
              }
              onDelete={() => setPendingDelete(item)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          ItemSeparatorComponent={ListSeparator}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Pagination
              page={page}
              totalPages={products.data?.meta.last_page ?? 1}
              totalItems={products.data?.meta.total}
              onChange={setPage}
              disabled={products.isFetching}
            />
          }
        />
      </ScreenState>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete product"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.title}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        isPending={remove.isPending}
        error={remove.error}
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${product.title}`}
        onPress={onEdit}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.7 }]}
      >
        <ImageWithFallback
          uri={product.image_url}
          style={styles.thumb}
          accessibilityLabel={product.title}
        />

        <View style={styles.rowBody}>
          <Text variant="bodyStrong" tone="primary" numberOfLines={1}>
            {product.title}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {product.slug}
            {product.category ? ` · ${product.category.name}` : ""}
          </Text>

          <View style={styles.rowMeta}>
            <Price amount={product.price} />
            <StockBadge stock={product.stock} />
            {!product.is_active ? (
              <Text variant="caption" tone="muted">
                Hidden
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={styles.rowActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${product.title}`}
          onPress={onDelete}
          hitSlop={8}
        >
          <Text variant="caption" tone="error">
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  search: {
    flex: 1,
  },
  add: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  skeletons: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  rowActions: {
    paddingHorizontal: spacing.sm,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: "transparent",
  },
});
