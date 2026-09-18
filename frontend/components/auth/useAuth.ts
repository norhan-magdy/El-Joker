"use client";

import { useAuthStore } from "@/store/auth";
import { useShallow } from "zustand/react/shallow";

export function useUser() {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated(): boolean {
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  return !!token && bootstrapped;
}

export function useAuth() {
  return useAuthStore(
    useShallow((s) => ({
      user: s.user,
      token: s.token,
      isAuthenticated: !!s.token && s.bootstrapped,
    })),
  );
}