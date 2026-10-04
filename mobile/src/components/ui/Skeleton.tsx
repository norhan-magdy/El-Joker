import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { radius, spacing } from "@/lib/theme/tokens";

type Props = {
  width?: number | `${number}%`;
  /** Omit to let `style` own the height, e.g. an `aspectRatio` box. */
  height?: number;
  borderRadius?: number;
  style?: object;
};

/**
 * Placeholder shown while a screen's data loads. Animates on the native driver
 * so a long list of skeletons never contends with the JS thread during scroll.
 */
export function Skeleton({
  width = "100%",
  height,
  borderRadius = radius.sm,
  style,
}: Props) {
  const { colors } = useTheme();
  const [pulse] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

/**
 * Placeholder shaped like `ProductCard` so the grid does not resize when the
 * real data lands.
 */
export function ProductCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <Skeleton style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Skeleton width="70%" height={12} />
        <Skeleton width="90%" height={15} />
        <Skeleton width="55%" height={17} style={styles.cardPrice} />
      </View>
    </View>
  );
}

export function RowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={56} height={56} borderRadius={radius.md} />
      <View style={styles.rowBody}>
        <Skeleton width="65%" height={14} />
        <Skeleton width="35%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.md,
    padding: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 0,
  },
  cardBody: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardPrice: {
    marginTop: "auto",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: spacing.sm,
  },
});