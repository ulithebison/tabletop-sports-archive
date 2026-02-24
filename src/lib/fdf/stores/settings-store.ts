import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../constants";

interface SettingsState {
  enhancedMode: boolean;
  setEnhancedMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      enhancedMode: false,
      setEnhancedMode: (enabled) => set({ enhancedMode: enabled }),
    }),
    { name: STORAGE_KEYS.SETTINGS }
  )
);
