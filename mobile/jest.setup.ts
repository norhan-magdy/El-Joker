/// <reference types="jest" />

/* eslint-env jest */

// expo-secure-store is a native module with no JS fallback. Back it with an
// in-memory map so token persistence logic is testable off-device.
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

// Silence the animation frame warnings Reanimated emits under the Jest
// environment; the mock below is only used by component tests.
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
);