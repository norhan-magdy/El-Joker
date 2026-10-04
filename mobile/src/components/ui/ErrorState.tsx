import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { errorMessage, isRateLimited } from "@/lib/api/errors";
import { spacing } from "@/lib/theme/tokens";

type Props = {
  error: unknown;
  onRetry?: () => void;
  title?: string;
};

/**
 * Renders the typed `ApiError` union.
 *
 * A 429 gets a live countdown from `Retry-After` so the retry button re-enables
 * when the limiter window actually rolls over, instead of inviting the user to
 * hammer a throttle they are already inside of.
 */
export function ErrorState({ error, onRetry, title }: Props) {
  const throttled = isRateLimited(error);
  const seconds = throttled ? (error.retryAfterSeconds ?? 60) : 0;

  const heading =
    title ??
    (error && typeof error === "object" && "status" in error && error.status === 0
      ? "No connection"
      : "Something went wrong");

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text variant="heading" tone="primary">
        {heading}
      </Text>
      <Text variant="body" tone="muted" style={styles.message}>
        {errorMessage(error)}
      </Text>

      {onRetry ? (
        throttled ? (
          // Keyed so a fresh 429 restarts the countdown instead of inheriting
          // the previous error's remaining time.
          <RetryButton key={seconds} seconds={seconds} onRetry={onRetry} />
        ) : (
          <Button label="Try again" onPress={onRetry} variant="secondary" />
        )
      ) : null}
    </View>
  );
}

/**
 * Holds the countdown on its own so the timer tick cannot cascade a re-render
 * through `ErrorState`. Mounted only for a throttled error.
 */
function RetryButton({
  seconds,
  onRetry,
}: {
  seconds: number;
  onRetry: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => {
      setRemaining((n) => Math.max(0, n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return (
    <Button
      label={remaining > 0 ? `Retry in ${remaining}s` : "Try again"}
      onPress={onRetry}
      disabled={remaining > 0}
      variant="secondary"
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  message: {
    textAlign: "center",
  },
});
