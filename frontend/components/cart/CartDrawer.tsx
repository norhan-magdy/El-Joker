"use client";

import Link from "next/link";
import { Drawer } from "@/components/shell/Drawer";
import { useCart } from "@/components/cart/useCart";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, subtotal } = useCart();

  return (
    <Drawer open={open} onClose={onClose} side="right" title="Cart">
      {items.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-text-muted">Your cart is empty.</p>
          <Link
            href="/shop"
            onClick={onClose}
            className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary-hover"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <ul className="flex-1 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <Link
                  href={`/products/${item.product.id}`}
                  onClick={onClose}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-background"
                >
                  <ImageWithFallback src={item.product.image_url} alt={item.product.title} sizes="48px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.product.id}`}
                    onClick={onClose}
                    className="block truncate text-sm font-medium text-text-primary hover:text-primary"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-xs text-text-muted">
                    Qty {item.quantity}
                  </p>
                </div>
                <Price value={item.line_total} className="shrink-0 text-sm font-medium" />
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <Price value={subtotal} className="font-semibold" />
            </div>
            <Link href="/cart" onClick={onClose} className="block">
              <Button fullWidth variant="secondary">
                View cart
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}