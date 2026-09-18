import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";
import { setAuthCookie, deleteAuthCookie } from "@/lib/auth-cookie";

interface AuthState {
  user: User | null;
  token: string | null;
  bootstrapped: boolean;
  setSession: (user: User, token: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  setBootstrapped: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      bootstrapped: false,

      setSession: (user: User, token: string) => {
        set({ user, token });
        setAuthCookie(token);
      },

      setUser: (user: User) => set({ user }),

      clearSession: () => {
        set({ user: null, token: null });
        deleteAuthCookie();
      },

      setBootstrapped: (bootstrapped: boolean) => set({ bootstrapped }),
    }),
    {
      name: "el-joker-auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthCookie(state.token);
        } else {
          deleteAuthCookie();
        }
      },
    },
  ),
);

export function getToken(): string | null {
  return useAuthStore.getState().token;
}