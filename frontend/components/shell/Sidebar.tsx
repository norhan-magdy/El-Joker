"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/auth/useAuth";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { Drawer } from "@/components/shell/Drawer";

const GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/categories", label: "Categories" },
    ],
  },
  {
    label: "Sales",
    items: [{ href: "/admin/orders", label: "Orders" }],
  },
  {
    label: "Access",
    items: [{ href: "/admin/roles", label: "Roles" }],
  },
];

function SidebarContent() {
  const pathname = usePathname();
  const user = useUser();

  const groups = GROUPS;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-text">
      <Link
        href="/admin"
        className="flex h-14 items-center gap-2 border-b border-white/10 px-5 text-lg font-semibold tracking-tight"
      >
        El-Joker<span className="text-primary">.</span>
        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/70">
          Admin
        </span>
      </Link>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto py-4">
        {groups.map((group) => {
          return (
            <div key={group.label} className="mb-6 px-3">
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-sidebar-muted">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex items-center rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                          active
                            ? "bg-primary/15 font-medium text-white"
                            : "text-sidebar-text hover:bg-white/5"
                        }`}
                      >
                        {active ? (
                          <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded bg-primary" />
                        ) : null}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/25 text-xs font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{user?.name}</div>
          </div>
          <LogoutButton className="text-sidebar-muted" />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block" aria-label="Admin sidebar">
      <SidebarContent />
    </aside>
  );
}

export function AdminTopbar({ title }: { title: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-black/5 lg:hidden"
        >
          <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <span className="flex-1 truncate text-lg font-semibold text-text-primary">{title}</span>
        <UserMenu compact />
      </div>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} side="left" title="Admin">
        <div onClick={() => setMobileOpen(false)}>
          <SidebarContent />
        </div>
      </Drawer>
    </>
  );
}