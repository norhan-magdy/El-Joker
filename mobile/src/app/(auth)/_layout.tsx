import { Stack } from "expo-router";

import { useTheme } from "@/hooks/use-theme";

/**
 * Authentication screens are only reachable while signed out, so this navigator
 * stays deliberately thin. The parent stack owns the guard; a layout guard here
 * would fight it and can produce a redirect loop.
 */
export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade_from_bottom",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
