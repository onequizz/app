import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TargetMode, Zone } from "@/lib/types";

export type Theme = "system" | "light" | "dark";

export interface Settings {
  attempts: number;
  mode: TargetMode;
  zone: Zone;
  toleranceKm: number;
  rounds: number;
  sound: boolean;
  hotCold: boolean;
  globe: boolean;
  theme: Theme;
}

interface SettingsStore extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export const DEFAULT_SETTINGS: Settings = {
  attempts: 3,
  mode: "mixed",
  zone: "world",
  toleranceKm: 75,
  rounds: 10,
  sound: true,
  hotCold: true,
  globe: false,
  theme: "system",
};

export const SETTINGS_STORAGE_KEY = "oq-settings";

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
    }),
    { name: SETTINGS_STORAGE_KEY, skipHydration: true },
  ),
);
