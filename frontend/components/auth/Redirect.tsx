"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function Redirect({ to, withNext = false }: { to: string; withNext?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const target = withNext ? `${to}?next=${encodeURIComponent(pathname)}` : to;
    router.replace(target);
  }, [router, pathname, to, withNext]);

  return null;
}