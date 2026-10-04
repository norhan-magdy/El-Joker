import { type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing } from "@/lib/theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Blocks backdrop and hardware-back dismissal for in-flight work. */
  dismissable?: boolean;
  /** Constrains the sheet height so long content scrolls instead of clipping. */
  maxHeightRatio?: number;
};

export function Dialog({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
  maxHeightRatio = 0.85,
}: Props) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android's hardware back button must go through the same guard as the
      // backdrop, otherwise a submitting dialog can be dismissed mid-request.
      onRequestClose={dismissable ? onClose : () => {}}
      statusBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        disabled={!dismissable}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: colors.overlayActive }]}
      >
        <Pressable
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: colors.elevated,
              borderColor: colors.border,
              maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          {title ? (
            <View style={styles.header}>
              <Text variant="heading" tone="primary">
                {title}
              </Text>
              {dismissable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={10}
                  onPress={onClose}
                >
                  <Text variant="heading" tone="muted">
                    ×
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  sheet: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  body: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
});
