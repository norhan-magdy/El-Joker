import { useEffect, useRef } from "react";
import { setBackgroundColorAsync } from "expo-system-ui";

import { useTheme } from "@/hooks/use-theme";

/**
 * Keeps the native window background in step with the app's own background
 * colour.
 *
 * Without this the OS paints a light strip behind a dark app during overscroll
 * and behind Android's navigation bar. A ref guards the effect so the async
 * call only fires when the resolved colour actually changes.
 */
export function useSystemUiBackground(): void {
  const { colors } = useTheme();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    if (applied.current === colors.background) return;
    applied.current = colors.background;
    void setBackgroundColorAsync(colors.background);
  }, [colors.background]);
}
