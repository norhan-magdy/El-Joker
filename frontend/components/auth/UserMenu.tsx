"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/auth/useAuth";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const items = [
    { href: "/account", label: "My account" },
    { href: "/favorites", label: "Favorites" },
    { href: "/orders", label: "Orders" },
    ...(user.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        className={`inline-flex max-w-44 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${compact ? "h-8" : "h-9"}`}
      >
        <span className="truncate">{user.name}</span>
        <svg aria-hidden className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {open ? (
        <div
          id="user-menu"
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-border bg-elevated p-1.5 shadow-xl"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center rounded-md px-3 py-2 text-sm text-text-primary transition-colors hover:bg-overlay"
            >
              {item.label}
            </Link>
          ))}
          {items.length > 0 ? <div className="my-1 h-px bg-border" /> : null}
          <div className="flex w-full items-center rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-overlay">
            <LogoutButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}