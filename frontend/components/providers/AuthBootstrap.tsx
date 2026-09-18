"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getMe, type ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { setAuthCookie } from "@/lib/auth-cookie";
import { useAuthStore } from "@/store/auth";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  const attemptRef = useRef(0);

  const meQuery = useQuery<{ data: User }, ApiError>({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: !!token,
    retry: 0,
    refetchOnWindowFocus: true,
  });

  // Guests (no token) are immediately "bootstrapped".
  useEffect(() => {
    if (!token && !bootstrapped) setBootstrapped(true);
  }, [token, bootstrapped, setBootstrapped]);

  // Session verified: merge roles into the user and re-sync the proxy cookie.
  useEffect(() => {
    if (meQuery.isSuccess && meQuery.data) {
      setUser(meQuery.data.data);
      if (token) setAuthCookie(token);
      setBootstrapped(true);
    }
  }, [meQuery.isSuccess, meQuery.data, setUser, setBootstrapped, token]);

  // Bootstrap failure: one backoff retry, then permanent guest degradation.
  const meError = meQuery.isError;
  const meFetching = meQuery.isFetching;
  const meRefetch = meQuery.refetch;
  useEffect(() => {
    if (!meError || meFetching || !token) return;
    if (attemptRef.current < 1) {
      attemptRef.current += 1;
      const t = setTimeout(() => {
        void meRefetch();
      }, 400);
      return () => clearTimeout(t);
    }
    // Failed the retry too — clear invalid session and stay guest forever.
    clearSession();
    setBootstrapped(true);
    queryClient.clear();
  }, [
    meError,
    meFetching,
    meRefetch,
    token,
    clearSession,
    setBootstrapped,
    queryClient,
  ]);

  return <>{children}</>;
}