import { type ReactNode } from "react";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

/**
 * `initialWindowMetrics` lets the first frame already know the insets. Without
 * it the provider measures asynchronously and every screen shifts down once the
 * measurement arrives, which is very visible on notched devices.
 */
export function SafeAreaProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {children}
    </SafeAreaProvider>
  );
}
