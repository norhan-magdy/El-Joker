"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { listCartItems } from "@/lib/api";
import { useUser, useIsAuthenticated } from "@/components/auth/useAuth";
import { UserMenu } from "@/components/auth/UserMenu";
import { Drawer } from "@/components/shell/Drawer";
import { Brand } from "@/components/shell/Brand";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { SearchBar } from "@/components/catalog/SearchBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useAuthStore } from "@/store/auth";

function useNavLinks() {
  return [
    { href: "/shop", label: "Shop" },
    { href: "/favorites", label: "Favorites" },
    { href: "/orders", label: "Orders" },
  ];
}

function StorefrontNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const links = useNavLinks();
  return (
    <nav aria-label="Main">
      <ul className="flex items-center gap-1 lg:gap-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                  active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.label}
                {active ? (
                  <span aria-hidden className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded bg-primary" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HeaderSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!value) return;
    timer.current = setTimeout(() => {
      router.push(`/shop?q=${encodeURIComponent(value)}`);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, router]);

  return <SearchBar value={value} onValueChange={setValue} debounceMs={300} className={className} />;
}

function useCartCount() {
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const query = useQuery({
    queryKey: ["cart"],
    queryFn: listCartItems,
    enabled: !!token && bootstrapped,
  });
  return query.data?.data.length ?? null;
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const user = useUser();
  const isAuthed = useIsAuthenticated();
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = useCartCount();

  const gotoAccount = (href: string, message: string) => {
    if (!isAuthed) {
      toast.error(message);
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    router.push(href);
  };

  const openCart = () => {
    if (!isAuthed) {
      toast.error("Please log in to view your cart");
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setCartOpen(true);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex items-center gap-6 lg:gap-8">
          <Brand />
          <div className="hidden lg:block">
            <StorefrontNav />
          </div>
        </div>

        <div className="ml-auto hidden w-64 lg:block">
          <HeaderSearch />
        </div>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-overlay hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
          </div>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => gotoAccount("/favorites", "Please log in to save favorites")}
            aria-label="Favorites"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-overlay hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={openCart}
            aria-label={cartCount ? `${cartCount} items in cart` : "Cart"}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-overlay hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            {cartCount ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-on-primary">
                {cartCount}
              </span>
            ) : null}
          </button>

          {isAuthed && user ? (
            <UserMenu />
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="ml-1 hidden h-10 items-center rounded-lg px-4 text-sm font-medium text-text-primary transition-colors hover:bg-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 sm:inline-flex"
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} side="right" title="Menu">
        <div className="space-y-6">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
          <div className="lg:hidden">
            <HeaderSearch />
          </div>
          <StorefrontNav onNavigate={() => setMobileOpen(false)} />
          {user && isAuthed ? (
            <div className="border-t border-border pt-4">
              <div className="mb-2 px-1 text-sm font-medium text-text-primary">Signed in as {user.name}</div>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center rounded-md px-2 py-2 text-sm text-text-secondary hover:bg-overlay hover:text-text-primary"
                  >
                    My account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center rounded-md px-2 py-2 text-sm text-text-secondary hover:bg-overlay hover:text-text-primary"
                  >
                    Admin
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium text-text-primary transition-colors hover:border-text-muted"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </header>
  );
}