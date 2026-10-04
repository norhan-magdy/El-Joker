import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router/js-tabs";

import { useTheme } from "@/hooks/use-theme";

/**
 * The shop is the app's public surface, so this navigator is intentionally
 * unguarded: browsing, search, and the account tab all work signed out. Screens
 * that genuinely require a customer session (cart, checkout, orders, favorites)
 * live in the root stack behind a guard instead of inside the tab bar, which
 * keeps the tab set stable and avoids the tab disappearing mid-session when a
 * token is revoked.
 *
 * `Tabs` must be imported from `expo-router/js-tabs`; the `expo-router` export
 * is deprecated as of SDK 57.
 */
export default function ShopLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
