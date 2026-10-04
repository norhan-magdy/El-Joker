import type { ColorScheme, ThemeName } from "./types";

/**
 * Colour tokens copied from `frontend/app/globals.css` so the web storefront
 * and the mobile app read as one product. Keep the hex values in sync with the
 * CSS custom properties there.
 */
export const colors: Record<ThemeName, ColorScheme> = {
  light: {
    background: "#f6f3ed",
    surface: "#ffffff",
    elevated: "#ffffff",

    primary: "#b01e2e",
    primaryHover: "#9a1a28",
    primaryActive: "#85161f",
    primaryWeak: "#fbe5e6",
    onPrimary: "#ffffff",

    textPrimary: "#1c1a17",
    textSecondary: "#57534e",
    textMuted: "#78716c",

    border: "#e7e2d8",
    borderStrong: "#d6cdbf",

    success: "#227a3c",
    successBg: "#e9f5ec",
    warning: "#9a6700",
    warningBg: "#fdf3dc",
    error: "#b3261e",
    errorBg: "#fceae7",
    errorHover: "#961d16",
    errorActive: "#7e1712",
    onError: "#ffffff",
    info: "#1f5f8b",
    infoBg: "#e8f1f8",

    focus: "#b01e2e",

    disabledText: "#a8a29e",
    disabledBg: "#e7e5e4",
    disabledBorder: "#d6d3d1",

    overlay: "rgba(0, 0, 0, 0.05)",
    overlayActive: "rgba(0, 0, 0, 0.10)",
  },

  dark: {
    background: "#141311",
    surface: "#1e1c1a",
    elevated: "#262320",

    primary: "#ef92a0",
    primaryHover: "#f4aab5",
    primaryActive: "#e07f8f",
    primaryWeak: "#3a2026",
    onPrimary: "#1a1114",

    textPrimary: "#edeae3",
    textSecondary: "#c3bdb2",
    textMuted: "#a8a29e",

    border: "#322e2a",
    borderStrong: "#45403a",

    success: "#7fd39b",
    successBg: "#16281d",
    warning: "#e0b95c",
    warningBg: "#2c2413",
    error: "#f2837b",
    errorBg: "#331816",
    errorHover: "#f59a93",
    errorActive: "#e06a61",
    onError: "#1a0f0e",
    info: "#8ec5e8",
    infoBg: "#14242f",

    focus: "#ef92a0",

    disabledText: "#6b6560",
    disabledBg: "#242220",
    disabledBorder: "#2f2c29",

    overlay: "rgba(0, 0, 0, 0.40)",
    overlayActive: "rgba(0, 0, 0, 0.60)",
  },
};

/** 4pt base scale. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

/**
 * Elevated-surface shadow. Lives here so `Card` and `ProductCard` cannot drift
 * apart; `elevation` is the Android value, the rest feed the iOS shadow.
 */
export const shadow = {
  offset: { width: 0, height: 1 },
  opacity: 0.05,
  radius: 3,
  elevation: 1,
} as const;

/** Minimum comfortable hit target on both platforms. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
export const MIN_TOUCH_TARGET = 44;