"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { addCartItem, errorMessage } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  fullWidth?: boolean;
  className?: string;
}

export function AddToCartButton({ product, quantity = 1, fullWidth = false, className = "" }: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => addCartItem({ product_id: product.id, quantity }),
    onSuccess: () => {
      toast.success("Added to cart");
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const isOutOfStock = typeof product.stock === "number" && product.stock === 0;

  const handleClick = () => {
    if (!token || !bootstrapped) {
      toast.error("Please log in to add items to your cart");
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    mutation.mutate();
  };

  if (isOutOfStock) {
    return (
      <Button variant="secondary" disabled fullWidth={fullWidth} className={className} aria-disabled>
        Out of stock
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      loading={mutation.isPending}
      fullWidth={fullWidth}
      className={className}
    >
      Add to cart
    </Button>
  );
}