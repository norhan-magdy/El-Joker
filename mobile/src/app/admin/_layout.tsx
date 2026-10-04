import { Stack } from "expo-router";

import { useTheme } from "@/hooks/use-theme";

/**
 * Admin console.
 *
 * Access is enforced by the parent stack's `Stack.Protected guard`, which keys
 * off `isAdminSession`. Re-checking here would be redundant, but the role is
 * surfaced in the header so an admin never has to guess which session they are
 * operating under — the device can hold a customer and an admin token at once.
 */
export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { color: colors.textPrimary },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Dashboard" }} />
      <Stack.Screen name="orders/index" options={{ title: "Orders" }} />
      <Stack.Screen name="orders/[id]" options={{ title: "Order" }} />
      <Stack.Screen name="products/index" options={{ title: "Products" }} />
      <Stack.Screen name="products/form" options={{ title: "Product" }} />
      <Stack.Screen name="categories" options={{ title: "Categories" }} />
    </Stack>
  );
}
