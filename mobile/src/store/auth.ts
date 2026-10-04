import { create } from "zustand";

import {
  clearTokenCache,
  getCachedToken,
  setCachedToken,
  setUnauthorizedHandler,
} from "@/lib/api/client";
import {
  adminLoginApi,
  adminLogoutApi,
  getMe,
  loginApi,
  logoutApi,
  registerApi,
} from "@/lib/api/auth";
import { deleteSecureItem, getSecureItem, setSecureItem } from "@/lib/storage";
import type { AuthResponse, User } from "@/lib/types";

/**
 * Why a session ended.
 *
 * `revoked_elsewhere` is not hypothetical: the backend deletes every token
 * sharing a name before issuing a new one, so signing in on the web with the
 * same account silently invalidates the phone's token. We can detect the 401
 * but we cannot prevent it, so we explain it rather than looping on re-login.
 */
export type SessionEndReason = "expired" | "revoked_elsewhere" | "logged_out";

export type Session = {
  token: string;
  user: User;
} | null;

type AuthState = {
  customer: Session;
  admin: Session;
  /** False until SecureStore has been read and live tokens verified. */
  bootstrapped: boolean;
  /** Set when a session was dropped, so the login screen can explain why. */
  endedReason: SessionEndReason | null;

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  logoutCustomer: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
  /** Revokes a session the server no longer honours. No network call. */
  invalidate: (
    scope: "customer" | "admin",
    reason: SessionEndReason
  ) => void;
  clearEndedReason: () => void;
};

const CUSTOMER_KEY = "eljoker.customer";
const ADMIN_KEY = "eljoker.admin";

async function persist(
  key: string,
  scope: "customer" | "admin",
  session: Session
): Promise<void> {
  setCachedToken(scope, session?.token ?? null);
  if (session) {
    await setSecureItem(key, JSON.stringify(session));
  } else {
    await deleteSecureItem(key);
  }
}

async function readSession(
  key: string,
  scope: "customer" | "admin"
): Promise<Session> {
  const raw = await getSecureItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    setCachedToken(scope, parsed?.token ?? null);
    return parsed?.token ? parsed : null;
  } catch {
    await deleteSecureItem(key);
    setCachedToken(scope, null);
    return null;
  }
}

function toUser(res: AuthResponse): User {
  return res.user;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  customer: null,
  admin: null,
  bootstrapped: false,
  endedReason: null,

  /**
   * Cold start: read both slots, then confirm each live one with `auth/me`.
   * A 401 means the server no longer honours the token, so drop that slot and
   * keep the other — an admin session must survive a stale customer token.
   *
   * `bootstrapped` is set in a `finally` so a SecureStore or network failure
   * degrades to "logged out" instead of leaving the app stuck on the splash
   * screen forever.
   */
  hydrate: async () => {
    try {
      const [customer, admin] = await Promise.all([
        readSession(CUSTOMER_KEY, "customer"),
        readSession(ADMIN_KEY, "admin"),
      ]);

      set({ customer, admin });

      const checks: Promise<void>[] = [];
      if (customer) {
        checks.push(
          getMe("customer").then(
            ({ data }) => set({ customer: { ...customer, user: data } }),
            () => get().invalidate("customer", "revoked_elsewhere")
          )
        );
      }
      if (admin) {
        checks.push(
          getMe("admin").then(
            ({ data }) => set({ admin: { ...admin, user: data } }),
            () => get().invalidate("admin", "revoked_elsewhere")
          )
        );
      }

      await Promise.all(checks);
    } catch {
      // Unreadable storage is indistinguishable from no session. Clearing both
      // slots prevents a half-restored session from reaching the API.
      await persist(CUSTOMER_KEY, "customer", null);
      await persist(ADMIN_KEY, "admin", null);
      set({ customer: null, admin: null });
    } finally {
      set({ bootstrapped: true });
    }
  },

  login: async (email, password) => {
    const res = await loginApi({ email, password });
    await persist(CUSTOMER_KEY, "customer", {
      token: res.token,
      user: toUser(res),
    });
    set({ customer: { token: res.token, user: toUser(res) }, endedReason: null });
    return toUser(res);
  },

  register: async (input) => {
    const res = await registerApi(input);
    await persist(CUSTOMER_KEY, "customer", {
      token: res.token,
      user: toUser(res),
    });
    set({ customer: { token: res.token, user: toUser(res) }, endedReason: null });
    return toUser(res);
  },

  adminLogin: async (email, password) => {
    const res = await adminLoginApi({ email, password });
    await persist(ADMIN_KEY, "admin", { token: res.token, user: toUser(res) });
    set({ admin: { token: res.token, user: toUser(res) }, endedReason: null });
    return toUser(res);
  },

  logoutCustomer: async () => {
    if (getCachedToken("customer")) {
      try {
        await logoutApi();
      } catch {
        // A dead token cannot be logged out; clearing locally is enough.
      }
    }
    await persist(CUSTOMER_KEY, "customer", null);
    set({ customer: null });
  },

  logoutAdmin: async () => {
    if (getCachedToken("admin")) {
      try {
        await adminLogoutApi();
      } catch {
        // Same as above.
      }
    }
    await persist(ADMIN_KEY, "admin", null);
    set({ admin: null });
  },

  invalidate: (scope, reason) => {
    const key = scope === "customer" ? CUSTOMER_KEY : ADMIN_KEY;
    void persist(key, scope, null);
    set({
      [scope]: null,
      endedReason: reason,
    } as Pick<AuthState, "customer" | "admin" | "endedReason">);
  },

  clearEndedReason: () => set({ endedReason: null }),
}));

// The transport reports 401s here instead of importing this store directly,
// which would create a cycle.
setUnauthorizedHandler((scope) => {
  useAuthStore.getState().invalidate(scope, "revoked_elsewhere");
});

/** True when the stored session has enough privilege for admin routes. */
export function isAdminSession(session: Session): boolean {
  return Boolean(session?.user.is_admin || session?.user.roles.includes("admin"));
}

export { clearTokenCache };