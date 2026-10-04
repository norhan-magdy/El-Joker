import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Base URL for the Laravel API.
 *
 * Resolved in `app.config.ts` so each environment can point somewhere
 * different. There is no `/v1` prefix — the backend mounts everything at bare
 * `/api`.
 *
 * An Android emulator shares the host's loopback interface under the alias
 * `10.0.2.2`, so an unqualified `localhost` would point at the emulator itself
 * and every request would fail. Physical devices need a real LAN IP instead,
 * which is why `EXPO_PUBLIC_API_URL` exists as an escape hatch.
 */
function resolveApiUrl(): string {
  const configured =
    (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
    "http://192.168.1.10:8000/api";

  if (Platform.OS === "android" && !process.env.EXPO_PUBLIC_API_URL) {
    return configured.replace("//localhost", "//192.168.1.10");
  }
  return configured;
}

export const API_URL: string = resolveApiUrl();

/** How long a single request may take before we surface a timeout error. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Only for SwiftUUIDs the backend returns — used for display, never as a key. */
export const ALL_CATEGORIES_MAX_PAGES = 20;
export const ALL_CATEGORIES_CAP = ALL_CATEGORIES_MAX_PAGES * 20;

export const PAGE_SIZE_PRODUCTS = 15;
export const PAGE_SIZE_CATEGORIES = 20;
export const PAGE_SIZE_ORDERS = 15;

export const CART_ITEM_MIN_QTY = 1;
export const CART_ITEM_MAX_QTY = 100;

export const PRODUCT_PRICE_MAX = 9999999999.99;

export const CHECKOUT_ADDRESS_MIN = 10;
export const CHECKOUT_ADDRESS_MAX = 2000;

export const THEME_STORAGE_KEY = "el-joker-theme";
export const LAST_ADDRESS_STORAGE_KEY = "el-joker-last-address";

/**
 * Which stored session a request should authenticate as.
 *
 * The backend issues single-use-per-name tokens: `/auth/login` revokes prior
 * tokens named `api`, `/admin/login` revokes prior tokens named `admin`. Two
 * separate slots therefore never interfere with each other, which lets one
 * device hold a customer session and an admin session simultaneously.
 */
export type AuthScope = "public" | "customer" | "admin";