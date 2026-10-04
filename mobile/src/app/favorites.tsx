import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/product/ProductCard";
import { GRID_COLUMNS, gridCell, gridListPadding } from "@/components/product/grid";
import { Screen } from "@/components/layout/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { listFavorites } from "@/lib/api/cart";
import { queryKeys } from "@/lib/query-keys";
import { spacing } from "@/lib/theme/tokens";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();

  const favorites = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: listFavorites,
    select: (res) => res.data,
  });

  return (
    <Screen padded={false}>
      <ScreenState
        isLoading={favorites.isLoading}
        error={favorites.error}
        isEmpty={(favorites.data ?? []).length === 0}
        onRetry={() => void favorites.refetch()}
        emptyTitle="Nothing saved yet"
        emptyMessage="Open a product and save it to keep it here."
        emptyActionLabel="Browse the shop"
        onEmptyAction={() => router.push("/home")}
      >
        <FlashList
          data={favorites.data ?? []}
          numColumns={GRID_COLUMNS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={gridCell.cell}>
              <ProductCard product={item} />
            </View>
          )}
          contentContainerStyle={{
            paddingHorizontal: gridListPadding,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
        />
      </ScreenState>
    </Screen>
  );
}
