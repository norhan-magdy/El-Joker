"use client";

import Link from "next/link";
import { Brand } from "@/components/shell/Brand";
import { useIsAuthenticated } from "@/components/auth/useAuth";

export function Footer() {
  const isAuthed = useIsAuthenticated();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div className="col-span-1">
            <Brand />
            <p className="mt-3 text-sm text-text-muted">An e-commerce demo store.</p>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Shop
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                  All products
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              My account
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/cart" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                  Favorites
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                  My orders
                </Link>
              </li>
            </ul>
          </div>
          {isAuthed ? (
            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                Admin
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/admin" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
        <div className="border-t border-border py-6 text-xs text-text-muted">
          &copy; {new Date().getFullYear()} El-Joker. All rights reserved.
        </div>
      </div>
    </footer>
  );
}