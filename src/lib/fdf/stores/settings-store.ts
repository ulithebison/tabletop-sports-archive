import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../constants";
import type { GameMode } from "../types";

export type FdfTheme = "dark" | "light" | "system";

interface SettingsState {
  enhancedMode: boolean;
  defaultGameMode: GameMode;
  theme: FdfTheme;
  setEnhancedMode: (enabled: boolean) => void;
  setDefaultGameMode: (mode: GameMode) => void;
  setTheme: (theme: FdfTheme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      enhancedMode: false,
      defaultGameMode: "dice",
      theme: "system",
      setEnhancedMode: (enabled) => set({ enhancedMode: enabled }),
      setDefaultGameMode: (mode) => set({ defaultGameMode: mode }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: STORAGE_KEYS.SETTINGS }
  )
);
