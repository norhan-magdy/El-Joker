"use client";

import Link from "next/link";
import { useUser } from "@/components/auth/useAuth";
import { useCart } from "@/components/cart/useCart";
import { useQuery } from "@tanstack/react-query";
import { listFavorites, listOrders } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountPage() {
  const user = useUser();
  const { items } = useCart();

  const favoritesQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: listFavorites,
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", 1],
    queryFn: () => listOrders(1),
  });

  if (!user) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  const shortcuts = [
    { href: "/cart", label: "Cart", meta: `${items.length} item${items.length === 1 ? "" : "s"}` },
    { href: "/favorites", label: "Favorites", meta: `${favoritesQuery.data?.data.length ?? 0} saved` },
    { href: "/orders", label: "Orders", meta: `${ordersQuery.data?.meta.total ?? 0} total` },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold leading-tight text-text-primary">My account</h1>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-text-primary">{user?.name}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
          <LogoutButton />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="group h-full p-5 transition-colors hover:border-text-muted">
              <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary">{s.label}</h3>
              <p className="mt-1 text-sm text-text-secondary">{s.meta}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Button asChild variant="secondary">
        <Link href="/">Continue shopping</Link>
      </Button>
    </div>
  );
}