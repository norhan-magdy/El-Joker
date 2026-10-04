import { Redirect } from "expo-router";

import { isAdminSession, useAuthStore } from "@/store/auth";

/**
 * Cold-start dispatcher and the app's anchor route.
 *
 * `Stack.Protected` can only fall back to the anchor (or first available screen)
 * because `redirectTo` requires SDK 58. Keeping this screen permanently
 * available means a route whose guard just flipped lands here and then somewhere
 * sensible, instead of on a blank screen.
 *
 * Browsing is public, so a signed-out visitor goes to the shop rather than to a
 * login wall — the same choice the web storefront makes. Only the admin
 * dispatcher is exclusive, because someone holding an admin session is
 * overwhelmingly likely to want the console.
 */
export default function Index() {
  const customer = useAuthStore((s) => s.customer);
  const admin = useAuthStore((s) => s.admin);

  if (isAdminSession(admin) && !customer) return <Redirect href="/admin" />;

  return <Redirect href="/home" />;
}
