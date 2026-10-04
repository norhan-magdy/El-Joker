import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { getThemePreference, setThemePreference } from "@/lib/storage";
import { colors } from "@/lib/theme/tokens";
import type { ColorScheme, ThemeName, ThemePreference } from "@/lib/theme/types";

type ThemeContextValue = {
  /** The preference the user chose, which may be `system`. */
  preference: ThemePreference;
  /** The palette actually in effect after resolving `system`. */
  scheme: ThemeName;
  colors: ColorScheme;
  setPreference: (value: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let active = true;
    void getThemePreference().then((stored) => {
      if (active && stored) setPreferenceState(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const scheme: ThemeName =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    void setThemePreference(value);
  }, []);

  const toggle = useCallback(() => {
    setPreferenceState((current) => {
      const resolved =
        current === "system"
          ? systemScheme === "dark"
            ? "dark"
            : "light"
          : current;
      const next: ThemeName = resolved === "dark" ? "light" : "dark";
      void setThemePreference(next);
      return next;
    });
  }, [systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      scheme,
      colors: colors[scheme],
      setPreference,
      toggle,
    }),
    [preference, scheme, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>.");
  }
  return ctx;
}

/** Convenience accessor for the common case of only needing the palette. */
export function useColors(): ColorScheme {
  return useTheme().colors;
}