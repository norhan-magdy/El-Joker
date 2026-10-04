import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";
import { spacing } from "@/lib/theme/tokens";

type Props = {
  children: ReactNode;
  /** Wraps content in a ScrollView. Off for screens that own a list. */
  scroll?: boolean;
  /** Extra bottom padding, e.g. to clear a fixed action footer. */
  bottomInset?: number;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * Base screen shell: themed background, safe-area handling, and an optional
 * scroll container with keyboard avoidance.
 *
 * Bottom padding is applied by hand rather than through `SafeAreaView` so that
 * scrollable content can extend under the home indicator while the final item
 * still clears it.
 */
export function Screen({
  children,
  scroll = false,
  bottomInset = 0,
  padded = true,
  refreshing = false,
  onRefresh,
  contentContainerStyle,
  style,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const padding = padded ? styles.padded : null;

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: colors.background }, style]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[
            padding,
            { paddingBottom: insets.bottom + bottomInset + spacing.xl },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.textMuted}
                colors={[colors.primary]}
                progressBackgroundColor={colors.surface}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, padding]}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
