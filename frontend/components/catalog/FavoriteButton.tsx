"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { addFavorite, listFavorites, removeFavorite, errorMessage } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

function useFavoriteIds() {
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: listFavorites,
    enabled: !!token && bootstrapped,
  });
  return new Set((query.data?.data ?? []).map((p) => p.id));
}

export function useIsFavorite(productId: string): boolean {
  return useFavoriteIds().has(productId);
}

function findCachedProduct(queryClient: ReturnType<typeof useQueryClient>, productId: string): Product | null {
  const needles: unknown[] = [{ queryKey: ["products", productId] }];
  for (const { queryKey } of needles as { queryKey: unknown[] }[]) {
    const data = queryClient.getQueryData<{ data: Product }>(queryKey as never);
    if (data?.data?.id === productId) return data.data;
  }
  const fallback = queryClient
    .getQueriesData<{ data: Product[] }>({ queryKey: ["products"], exact: false })
    .flatMap(([, value]) => value?.data ?? []);

  // include product-detail matches already covered + list cache
  const found = fallback.find((p) => p.id === productId);
  if (found) return found;
  return null;
}

interface FavoriteButtonProps {
  productId: string;
  variant?: "icon" | "pill";
  className?: string;
}

export function FavoriteButton({ productId, variant = "icon", className = "" }: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const queryClient = useQueryClient();
  const isFavorite = useIsFavorite(productId);

  const mutation = useMutation({
    mutationFn: (add: boolean) => (add ? addFavorite(productId) : removeFavorite(productId)),
    onMutate: async (add) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const prev = queryClient.getQueryData<{ data: Product[] }>(["favorites"]);
      queryClient.setQueryData<{ data: Product[] }>(["favorites"], (old) => {
        const current = old?.data ?? [];
        if (add) {
          const cached = findCachedProduct(queryClient, productId);
          const existing = current.some((p) => p.id === productId);
          if (existing) return old;
          const stub: Product =
            cached ??
            ({
              id: productId,
              title: "",
              slug: "",
              description: null,
              price: 0,
              image_url: "",
              is_active: true,
              created_at: new Date().toISOString(),
            } as Product);
          return { ...old, data: [stub, ...current] };
        }
        return { ...old, data: current.filter((p) => p.id !== productId) };
      });
      return { prev };
    },
    onError: (err, _add, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["favorites"], ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleClick = useCallback(() => {
    if (!token || !bootstrapped) {
      toast.error("Please log in to save favorites");
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    mutation.mutate(!isFavorite);
  }, [token, bootstrapped, isFavorite, mutation, router, pathname]);

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isFavorite}
        disabled={mutation.isPending}
        className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
          isFavorite
            ? "border-primary/40 bg-primary-weak text-primary"
            : "border-border-strong bg-surface text-text-primary hover:border-text-muted"
        } ${className}`}
      >
        <HeartIcon filled={isFavorite} />
        {isFavorite ? "Saved" : "Save to favorites"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      disabled={mutation.isPending}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md bg-surface/90 text-text-secondary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 disabled:cursor-not-allowed hover:text-primary ${className}`}
    >
      <HeartIcon filled={isFavorite} />
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}