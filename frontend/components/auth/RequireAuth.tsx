"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import { Redirect } from "@/components/auth/Redirect";

export function RequireAuth({
  children,
  loginPath = "/login",
}: {
  children: ReactNode;
  loginPath?: string;
}) {
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  if (!bootstrapped) {
    return (
      <div className="min-h-[50vh] space-y-4 p-6 sm:p-8" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full sm:w-1/2" />
      </div>
    );
  }

  if (!token) {
    return <Redirect to={loginPath} withNext />;
  }

  return <>{children}</>;
}