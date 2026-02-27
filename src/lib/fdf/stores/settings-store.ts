import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../constants";

export type FdfTheme = "dark" | "light" | "system";

interface SettingsState {
  enhancedMode: boolean;
  theme: FdfTheme;
  setEnhancedMode: (enabled: boolean) => void;
  setTheme: (theme: FdfTheme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      enhancedMode: false,
      theme: "system",
      setEnhancedMode: (enabled) => set({ enhancedMode: enabled }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: STORAGE_KEYS.SETTINGS }
  )
);
