"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateCartItem, removeCartItem, errorMessage } from "@/lib/api";
import type { CartItem } from "@/lib/types";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Price } from "@/components/ui/Price";
import { QuantityStepper } from "@/components/cart/QuantityStepper";

export function CartItemRow({ item }: { item: CartItem }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (quantity: number) => updateCartItem(item.id, { quantity }),
    onMutate: async (quantity) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const prev = queryClient.getQueryData<{ data: CartItem[] }>(["cart"]);
      queryClient.setQueryData<{ data: CartItem[] }>(["cart"], (old) => ({
        ...old,
        data: (old?.data ?? []).map((i) =>
          i.id === item.id ? { ...i, quantity, line_total: item.product.price * quantity } : i,
        ),
      }));
      return { prev };
    },
    onError: (err, _q, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["cart"], ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeCartItem(item.id),
    onSuccess: () => {
      toast.success("Item removed");
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <li className="flex items-start gap-4 border-b border-border py-4">
      <Link href={`/products/${item.product.id}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-background">
        <ImageWithFallback src={item.product.image_url} alt={item.product.title} sizes="64px" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${item.product.id}`}
          className="line-clamp-2 text-sm font-medium leading-5 text-text-primary hover:text-primary"
        >
          {item.product.title}
        </Link>
        <p className="mt-1 text-sm text-text-muted">
          <Price value={item.product.price} /> each
        </p>
        <div className="mt-2 flex items-center gap-3">
          <QuantityStepper
            value={item.quantity}
            onChange={(v) => updateMutation.mutate(v)}
            disabled={updateMutation.isPending || removeMutation.isPending}
          />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Price value={item.line_total} className="text-sm font-medium text-text-primary" />
        <button
          type="button"
          onClick={() => removeMutation.mutate()}
          disabled={removeMutation.isPending}
          aria-label={`Remove ${item.product.title} from cart`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-overlay hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482 41.03 41.03 0 0 0-2.365-.298V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </li>
  );
}