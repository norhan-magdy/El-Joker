"use client";

import { Toaster } from "sonner";

export function SonnerProvider() {
  return (
    <Toaster
      position="top-right"
      theme="light"
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