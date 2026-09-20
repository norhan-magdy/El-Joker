"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/hooks/use-theme";

export function SonnerProvider() {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={isDark ? "dark" : "light"}
      richColors
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "!shadow-xl !border !border-border !bg-elevated !text-text-primary",
        },
      }}
    />
  );
}