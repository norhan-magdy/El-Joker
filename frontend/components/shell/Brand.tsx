"use client";

import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/shop"
      className="rounded-md text-lg font-semibold tracking-tight text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      El-Joker<span className="text-primary">.</span>
    </Link>
  );
}