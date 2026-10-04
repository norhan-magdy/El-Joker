import { useEffect } from "react";

import { useAuthStore } from "@/store/auth";

/**
 * Runs the one-time session restore exactly once for the app's lifetime.
 *
 * Every route that reads auth state must sit behind this gate. Until both
 * SecureStore slots have been read and the live tokens verified, a stored
 * session still looks "logged out", so a protected screen would bounce the user
 * to login and then immediately back — a visible flash on every cold start.
 *
 * `bootstrapped` is set in a `finally` inside `hydrate`, so a failure in
 * SecureStore degrades to "logged out" instead of hanging on the splash screen.
 */
export function useHydrateAuth(): { bootstrapped: boolean } {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (bootstrapped) return;
    void hydrate();
  }, [bootstrapped, hydrate]);

  return { bootstrapped };
}
