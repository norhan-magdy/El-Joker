import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from "@/lib/constants";

function cookieAttributes(maxAge?: number): string {
  // const parts = ["SameSite=Lax", "Path=/", "HttpOnly"];
  const parts = ["SameSite=Lax", "Path=/"];
  if (typeof maxAge === "number") parts.push(`Max-Age=${maxAge}`);
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function setAuthCookie(token: string): void {
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes(AUTH_COOKIE_MAX_AGE)}`;
}

export function deleteAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; ${cookieAttributes(0)}`;
}

export function readAuthCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]*)`),
  );
  if (!match || !match[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}