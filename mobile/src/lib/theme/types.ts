/** Design tokens are mirrored from `frontend/app/globals.css`. */

export type ThemeName = "light" | "dark";

export type ThemePreference = ThemeName | "system";

export type ColorScheme = {
  background: string;
  surface: string;
  elevated: string;

  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryWeak: string;
  onPrimary: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  border: string;
  borderStrong: string;

  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  errorHover: string;
  errorActive: string;
  onError: string;
  info: string;
  infoBg: string;

  focus: string;

  disabledText: string;
  disabledBg: string;
  disabledBorder: string;

  overlay: string;
  overlayActive: string;
};