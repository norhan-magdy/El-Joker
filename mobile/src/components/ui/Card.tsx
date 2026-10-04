import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { radius, shadow, spacing } from "@/lib/theme/tokens";

type Props = {
  children: React.ReactNode;
  /** `flat` drops the border for nested surfaces. */
  variant?: "default" | "flat";
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  variant = "default",
  padded = true,
  style,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        {
          backgroundColor: colors.surface,
          borderColor: variant === "flat" ? "transparent" : colors.border,
          shadowColor: colors.textPrimary,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOffset: shadow.offset,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
    elevation: shadow.elevation,
  },
  padded: {
    padding: spacing.lg,
  },
});