import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/hooks/use-theme";
import { radius } from "@/lib/theme/tokens";

/**
 * Light/dark toggle for the app header.
 *
 * Flips the *resolved* scheme rather than the stored preference, so tapping it
 * from `system` pins a concrete theme instead of silently following the OS
 * forever. The settings screen exposes the full three-way choice.
 */
export function ThemeToggleButton() {
  const { scheme, toggle, colors } = useTheme();
  const nextIsDark = scheme === "light";

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: nextIsDark }}
      accessibilityLabel="Dark mode"
      accessibilityHint={
        nextIsDark ? "Turns off dark mode" : "Turns on dark mode"
      }
      hitSlop={10}
      onPress={toggle}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.overlay,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons
        name={nextIsDark ? "moon-outline" : "sunny-outline"}
        size={18}
        color={colors.textPrimary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
