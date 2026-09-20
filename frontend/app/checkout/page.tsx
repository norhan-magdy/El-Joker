"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkout, errorMessage } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Price } from "@/components/ui/Price";
import { useCart } from "@/components/cart/useCart";
import { formatShortId } from "@/lib/constants";

const checkoutSchema = z.object({
  shipping_address: z
    .string()
    .min(10, "Shipping address must be at least 10 characters")
    .max(2000, "Shipping address must be at most 2000 characters"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, subtotal } = useCart();
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { shipping_address: "" },
  });

  const mutation = useMutation({
    mutationFn: checkout,
    onSuccess: (response) => {
      setCreatedOrderId(response.data.id);
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => {
      toast.error(errorMessage(err));
    },
  });

  if (createdOrderId) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 xl:px-8">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Card className="w-full max-w-md p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
              <svg aria-hidden className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            </span>
            <h1 className="mt-4 text-2xl font-semibold text-text-primary">Order placed</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Your order <span className="font-mono font-medium text-primary">#{formatShortId(createdOrderId)}</span> has
              been received. Thanks for shopping with us!
            </p>
            <div className="mt-6 space-y-2">
              <Button asChild fullWidth>
                <Link href={`/orders/${createdOrderId}`}>View order</Link>
              </Button>
              <Button asChild variant="secondary" fullWidth>
                <Link href="/">Continue shopping</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 xl:px-8">
      <div className="space-y-8">
        <h1 className="text-3xl font-semibold leading-tight text-text-primary">Checkout</h1>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <Card className="p-5 sm:p-6">
              <h2 className="text-base font-semibold text-text-primary">Shipping address</h2>
              <div className="mt-4 flex flex-col gap-1.5">
                <Label htmlFor="shipping_address">Shipping address</Label>
                <Textarea
                  id="shipping_address"
                  rows={4}
                  maxLength={2000}
                  placeholder="123 Main Street, Springfield, 12345"
                  invalid={!!errors.shipping_address}
                  {...register("shipping_address")}
                  autoFocus
                />
                {errors.shipping_address ? (
                  <p className="text-sm text-error" role="alert">{errors.shipping_address.message}</p>
                ) : (
                  <p className="text-xs text-text-muted">Full address including street, city, and postal code.</p>
                )}
              </div>
            </Card>

            <Card className="p-5 sm:p-6 lg:self-start">
              <h2 className="text-base font-semibold text-text-primary">Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-text-secondary">
                  <dt>Items ({items.length})</dt>
                  <dd className="tabular-nums">{items.length}</dd>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <dt>Subtotal</dt>
                  <dd>
                    <Price value={subtotal} />
                  </dd>
                </div>
                <div className="my-2 h-px bg-border" />
                <div className="flex items-center justify-between text-text-primary">
                  <dt className="font-medium">Total</dt>
                  <dd className="font-semibold">
                    <Price value={subtotal} />
                  </dd>
                </div>
              </dl>
              {items.length === 0 && (
                <p className="mt-4 rounded-lg bg-error-bg p-3 text-sm text-error">
                  Your cart is empty. Add items before checking out.
                </p>
              )}
              <Button
                type="submit"
                fullWidth
                className="mt-5"
                loading={isSubmitting || mutation.isPending}
                disabled={items.length === 0}
              >
                Place order
              </Button>
            </Card>
          </div>
        </form>

        <Button variant="ghost" onClick={() => router.push("/cart")}>
          ← Back to cart
        </Button>
      </div>
    </div>
  );
}