"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/useCart";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const { items, count, subtotal } = useCart();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold leading-tight text-text-primary">Cart</h1>

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          caption="Looks like you haven't added anything yet. Browse the catalog to get started."
          action={
            <Button asChild>
              <Link href="/">Browse products</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <ul className="rounded-lg border border-border bg-surface px-5 shadow-sm" aria-label="Cart items">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </ul>
          <div className="lg:top-24 lg:self-start">
            <CartSummary count={count} subtotal={subtotal} />
          </div>
        </div>
      )}
    </div>
  );
}