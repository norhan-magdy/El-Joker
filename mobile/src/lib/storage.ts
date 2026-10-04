import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  LAST_ADDRESS_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/lib/config";
import type { ThemePreference } from "@/lib/theme/types";

/**
 * SecureStore has a 2048-byte value limit and is unavailable on web, so the
 * web build falls back to AsyncStorage. Tokens are the only secrets written
 * here, and only on native.
 */
const secureStorageAvailable = Platform.OS !== "web";

export async function setSecureItem(
  key: string,
  value: string
): Promise<void> {
  if (secureStorageAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

export async function getSecureItem(
  key: string
): Promise<string | null> {
  if (secureStorageAvailable) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (secureStorageAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

/* -------------------------------------------------------------------------
 * Non-secret preferences and local-only conveniences (plain AsyncStorage)
 * ---------------------------------------------------------------------- */

export async function getThemePreference(): Promise<ThemePreference | null> {
  const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : null;
}

export async function setThemePreference(
  value: ThemePreference
): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, value);
}

/**
 * The API has no address book, so the last address a customer checked out
 * with is cached on-device purely to save retyping. Never synced anywhere.
 */
export async function getLastAddress(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_ADDRESS_STORAGE_KEY);
}

export async function setLastAddress(value: string): Promise<void> {
  await AsyncStorage.setItem(LAST_ADDRESS_STORAGE_KEY, value);
}