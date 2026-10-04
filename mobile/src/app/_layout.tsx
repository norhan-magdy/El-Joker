import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Spinner } from "@/components/ui/Spinner";
import { useHydrateAuth } from "@/hooks/use-hydrate-auth";
import { useTheme } from "@/hooks/use-theme";
import { useSystemUiBackground } from "@/hooks/use-system-ui";
import { QueryProvider } from "@/providers/QueryProvider";
import { SafeAreaProviderWrapper } from "@/providers/SafeAreaProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { isAdminSession, useAuthStore } from "@/store/auth";

// Called at module scope, never inside a component: by the time a component
// effect runs the native splash may already have faded on its own.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProviderWrapper>
        <ThemeProvider>
          <QueryProvider>
            <RootNavigator />
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProviderWrapper>
    </GestureHandlerRootView>
  );
}

/**
 * Split out from `RootLayout` so the theme provider is guaranteed to be an
 * ancestor: the navigator config below reads the resolved palette.
 */
function RootNavigator() {
  const { colors, scheme } = useTheme();
  const { bootstrapped } = useHydrateAuth();
  const customer = useAuthStore((s) => s.customer);
  const admin = useAuthStore((s) => s.admin);

  useSystemUiBackground();

  useEffect(() => {
    if (bootstrapped) void SplashScreen.hideAsync();
  }, [bootstrapped]);

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/*
        Nothing below this point may read auth state before `bootstrapped`.
        The gates below would otherwise bounce a signed-in user to the login
        screen and straight back on every cold start.
      */}
      {!bootstrapped ? (
        <View style={[styles.fill, { backgroundColor: colors.background }]}>
          <Spinner />
        </View>
      ) : (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { color: colors.textPrimary },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          {/* Browsing the catalogue is public, matching the web storefront. */}
          <Stack.Screen name="(shop)" options={{ headerShown: false }} />
          {/*
            The detail route is keyed by product id, not slug: Laravel binds
            `products/{product}` on the primary key because Product does not
            override `getRouteKeyName()`.
          */}
          <Stack.Screen name="product/[id]" options={{ title: "" }} />

          {/*
            `Stack.Protected` replaces the default "every screen is available"
            behaviour. `redirectTo` is SDK 58+, so a denied route falls back to
            the anchor route, which is the always-available `index` screen that
            dispatches by session state.
          */}
          <Stack.Protected guard={Boolean(customer)}>
            <Stack.Screen name="cart" options={{ title: "Your cart" }} />
            <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
            <Stack.Screen name="favorites" options={{ title: "Favorites" }} />
            <Stack.Screen name="orders" options={{ title: "Your orders" }} />
          </Stack.Protected>

          <Stack.Protected guard={isAdminSession(admin)}>
            <Stack.Screen name="admin" options={{ headerShown: false }} />
          </Stack.Protected>

          {/*
            Staff sign-in sits outside `(auth)` on purpose. That group is gated
            on the *customer* session, so a shopper with an active customer
            session would have no route left to reach the staff form from.
          */}
          <Stack.Protected guard={!isAdminSession(admin)}>
            <Stack.Screen
              name="admin-login"
              options={{ title: "Staff sign in" }}
            />
          </Stack.Protected>

          <Stack.Protected guard={!customer}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
