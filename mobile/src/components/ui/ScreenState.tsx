import { StyleSheet, View } from "react-native";

import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { spacing } from "@/lib/theme/tokens";

type Props = {
  isLoading: boolean;
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  children: React.ReactNode;
  /** Shown instead of the spinner, e.g. a skeleton grid. */
  loadingFallback?: React.ReactNode;
};

/**
 * Renders the loading / error / empty triad exactly once per screen so no
 * screen re-implements the precedence rules. Errors win over empty, and both
 * win over content, because a failed query has no trustworthy data.
 */
export function ScreenState({
  isLoading,
  error,
  isEmpty,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  children,
  loadingFallback,
}: Props) {
  if (isLoading) {
    return <View style={styles.fill}>{loadingFallback ?? <Spinner />}</View>;
  }

  if (error) {
    return (
      <View style={styles.fill}>
        <ErrorState error={error} onRetry={onRetry} />
      </View>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});