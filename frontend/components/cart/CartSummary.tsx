"use client";

import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";

interface CartSummaryProps {
  count: number;
  subtotal: number;
}

export function CartSummary({ count, subtotal }: CartSummaryProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5">
      <h3 className="text-lg font-semibold text-text-primary">Summary</h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <dt>Items ({count})</dt>
          <dd className="tabular-nums">{count}</dd>
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
      <div className="mt-5 space-y-2">
        <Link href="/checkout" className="block">
          <Button fullWidth>Checkout</Button>
        </Link>
        <Link href="/" className="block">
          <Button variant="secondary" fullWidth>
            Continue shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}