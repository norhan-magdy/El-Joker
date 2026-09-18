"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutApi, errorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { getQueryClient } from "@/lib/query-client";

export function useLogout() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = getQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      clearSession();
      queryClient.clear();
      toast.success("Logged out");
      router.push("/");
    },
    onError: (err) => {
      toast.error(errorMessage(err));
    },
  });
}

export function LogoutButton({ className = "" }: { className?: string }) {
  const logout = useLogout();

  return (
    <button
      type="button"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      className={`inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${className}`}
    >
      {logout.isPending ? `Signing out\u2026` : "Log out"}
    </button>
  );
}