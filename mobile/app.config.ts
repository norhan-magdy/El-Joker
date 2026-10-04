import type { ExpoConfig } from "expo/config";

/**
 * API base URL for the Laravel backend.
 *
 * The backend serves JSON at `/api` with no version prefix and listens on port
 * 8000 by default (`php artisan serve`).
 *
 * Android emulators cannot reach the host over `localhost`; they need the
 * loopback alias `10.0.2.2`, which `src/lib/config.ts` substitutes at runtime.
 * Physical devices need the machine's LAN IP — set `EXPO_PUBLIC_API_URL`.
 */
function resolveApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const host = process.env.EXPO_PUBLIC_API_HOST ?? "192.168.1.10:8000";
  return `http://${host}/api`;
}

export default (): ExpoConfig => ({
  name: "El-Joker",
  slug: "el-joker",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "eljoker",
  userInterfaceStyle: "automatic",
  backgroundColor: "#f6f3ed",
  runtimeVersion: "1.0.0",

  ios: {
    bundleIdentifier: "test.commerce.eljoker",
    supportsTablet: true,
  },
  android: {
    package: "test.commerce.eljoker",
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: "#b01e2e",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#b01e2e",
        image: "./assets/images/splash-icon.png",
        imageWidth: 160,
      },
    ],
    "expo-secure-store",
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    apiUrl: resolveApiUrl(),
  },
});