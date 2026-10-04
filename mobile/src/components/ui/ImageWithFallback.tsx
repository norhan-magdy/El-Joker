import { useState } from "react";
import { StyleSheet, View, type ImageStyle, type StyleProp } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/use-theme";
import { radius } from "@/lib/theme/tokens";

type Props = {
  uri?: string | null;
  /** Drives the aspect ratio of the placeholder frame. */
  ratio?: number;
  style?: StyleProp<ImageStyle>;
  radiusOverride?: number;
  accessibilityLabel?: string;
};

/**
 * Product images come from admin-entered URLs, so a 404 or a non-image response
 * is an expected failure rather than an exception. This renders the themed
 * placeholder instead, and does not attempt to re-render a broken source.
 *
 * `expo-image` rather than React Native's `Image`: a catalogue grid recycles its
 * cells, and only the native view has a real disk cache plus a cross-dissolve,
 * so scrolling back does not re-download and rows do not flash empty. It is a
 * native module, so it needs a real build rather than Expo Go.
 */
export function ImageWithFallback({
  uri,
  ratio = 1,
  style,
  radiusOverride = radius.md,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  const frame = [
    styles.frame,
    {
      aspectRatio: ratio,
      borderRadius: radiusOverride,
      backgroundColor: colors.overlay,
    },
    style,
  ];

  if (!uri || failed) {
    return (
      <View
        style={frame}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        <View
          style={[styles.placeholderMark, { backgroundColor: colors.border }]}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      transition={200}
      onError={() => setFailed(true)}
      style={frame}
    />
  );
}

/**
 * Kept as a guard: `expo-image`'s `style` is narrower than React Native's
 * `ImageStyle`, so a stray React Native `Image` import would fail the bundle
 * check instead of silently losing the disk cache.
 */
const styles = StyleSheet.create({
  frame: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderMark: {
    width: "35%",
    aspectRatio: 1,
    borderRadius: radius.pill,
    opacity: 0.6,
  },
});
