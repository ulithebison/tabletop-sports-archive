import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../constants";
import type { GameMode } from "../types";

export type FdfTheme = "dark" | "light" | "system";

interface SettingsState {
  enhancedMode: boolean;
  defaultGameMode: GameMode;
  sevenPlusMinuteDriveRule: boolean;
  theme: FdfTheme;
  setEnhancedMode: (enabled: boolean) => void;
  setDefaultGameMode: (mode: GameMode) => void;
  setSevenPlusMinuteDriveRule: (enabled: boolean) => void;
  setTheme: (theme: FdfTheme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      enhancedMode: false,
      defaultGameMode: "dice",
      sevenPlusMinuteDriveRule: false,
      theme: "system",
      setEnhancedMode: (enabled) => set({ enhancedMode: enabled }),
      setDefaultGameMode: (mode) => set({ defaultGameMode: mode }),
      setSevenPlusMinuteDriveRule: (enabled) => set({ sevenPlusMinuteDriveRule: enabled }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: STORAGE_KEYS.SETTINGS }
  )
);
