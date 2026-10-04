import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Text } from "@/components/ui/Text";
import { errorMessage } from "@/lib/api/errors";
import { spacing } from "@/lib/theme/tokens";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isPending?: boolean;
  error?: unknown;
  /** Optional form content rendered between the message and the buttons. */
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Destructive-action confirmation.
 *
 * While a request is in flight the dialog becomes non-dismissable, so a slow
 * network cannot leave the user believing a delete was cancelled when it is
 * still committing. A 409/422 from the API is shown inline rather than as a
 * toast, because these confirmations wrap state-changing calls where the
 * failure reason matters.
 *
 * `children` renders above the buttons, which lets a confirmation also collect
 * the values the write needs (for example a payment provider) without falling
 * back to a bare `Dialog`.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isPending = false,
  error,
  children,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog
      visible={visible}
      onClose={onCancel}
      title={title}
      dismissable={!isPending}
      maxHeightRatio={0.6}
    >
      <View style={styles.body}>
        <Text variant="body" tone="secondary">
          {message}
        </Text>

        {error ? (
          <Text variant="caption" tone="error">
            {errorMessage(error)}
          </Text>
        ) : null}

        {children}

        <View style={styles.actions}>
          <Button
            label={cancelLabel}
            onPress={onCancel}
            variant="secondary"
            disabled={isPending}
            style={styles.action}
          />
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            variant={destructive ? "danger" : "primary"}
            loading={isPending}
            disabled={isPending}
            style={styles.action}
          />
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
});
