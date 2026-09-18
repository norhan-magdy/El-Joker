"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthBootstrap } from "@/components/providers/AuthBootstrap";
import { SonnerProvider } from "@/components/toast/SonnerProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthBootstrap>
        {children}
        <SonnerProvider />
      </AuthBootstrap>
    </QueryProvider>
  );
}