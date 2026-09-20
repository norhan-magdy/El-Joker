"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "el-joker-theme";

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  mounted: boolean;
}

const UNMOUNTED: ThemeState = { theme: "light", isDark: false, mounted: false };

let snapshot: ThemeState = UNMOUNTED;
let initialized = false;
const listeners = new Set<() => void>();

function read(): ThemeState {
  let theme: Theme = "light";
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    theme = stored === "light" || stored === "dark" ? stored : getSystemTheme();
  }
  return { theme, isDark: theme === "dark", mounted: true };
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function sync() {
  snapshot = read();
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", snapshot.isDark);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  if (!initialized) {
    initialized = true;
    if (typeof window !== "undefined") {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", sync);
      window.addEventListener("storage", sync);
      sync();
    }
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): ThemeState {
  return snapshot;
}

function getServerSnapshot(): ThemeState {
  return UNMOUNTED;
}

export function useTheme() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const next: Theme = state.isDark ? "light" : "dark";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    sync();
  }, [state.isDark]);

  return { theme: state.theme, isDark: state.isDark, mounted: state.mounted, toggleTheme };
}