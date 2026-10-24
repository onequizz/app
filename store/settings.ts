import { create } from "zustand";
import { persist } from "zustand/middleware";
import { QUIZ_THEMES } from "@/lib/data/features";
import type { QuizTheme, Zone } from "@/lib/types";

export type Theme = "system" | "light" | "dark";

export interface Settings {
  attempts: number;
  /** Thèmes mélangés dans une partie (au moins un). */
  themes: QuizTheme[];
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
  /** Ajoute ou retire un thème (le dernier thème choisi reste sélectionné). */
  toggleTheme: (theme: QuizTheme) => void;
  /** « Tout » : coche tous les thèmes ; s'ils le sont déjà, ne garde que le premier. */
  toggleAllThemes: () => void;
}

export const DEFAULT_SETTINGS: Settings = {
  attempts: 3,
  themes: ["country", "capital"],
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
      toggleTheme: (theme) =>
        set((s) => {
          const has = s.themes.includes(theme);
          if (has && s.themes.length === 1) return s;
          return { themes: QUIZ_THEMES.filter((t) => (t === theme ? !has : s.themes.includes(t))) };
        }),
      toggleAllThemes: () =>
        set((s) => ({ themes: s.themes.length === QUIZ_THEMES.length ? [QUIZ_THEMES[0]] : [...QUIZ_THEMES] })),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      skipHydration: true,
      version: 1,
      // v0 : un seul quiz (`mode`), dont « mixed » (pays + capitales) et « nature » (tous les thèmes nature).
      migrate: (persisted, version) => {
        const state = persisted as Partial<Settings> & { mode?: string };
        if (version < 1 && state.mode) {
          const { mode, ...rest } = state;
          const themes: QuizTheme[] =
            mode === "mixed"
              ? ["country", "capital"]
              : mode === "nature"
                ? QUIZ_THEMES.filter((t) => t !== "country" && t !== "capital")
                : (QUIZ_THEMES as string[]).includes(mode)
                  ? [mode as QuizTheme]
                  : DEFAULT_SETTINGS.themes;
          return { ...rest, themes } as SettingsStore;
        }
        return persisted as SettingsStore;
      },
    },
  ),
);
