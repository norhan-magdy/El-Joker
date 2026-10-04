import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { createQueryClient } from "@/lib/query-client";

/**
 * Holds the QueryClient in state so a re-render of the provider's owner cannot
 * discard the whole cache. Creating it during render (module scope or inline)
 * would build a new client on every render, which silently disables caching.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState<QueryClient>(() => createQueryClient());

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
