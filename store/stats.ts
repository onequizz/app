import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TargetStat } from "@/lib/game/engine";
import type { SessionMode } from "@/lib/types";

export interface GameRecord {
  mode: SessionMode;
  score: number;
  correct: number;
  total: number;
  date: string;
}

export interface DailyRecord {
  score: number;
  correct: number;
  grid: string;
}

interface StatsStore {
  games: number;
  rounds: number;
  correct: number;
  bestStreak: number;
  bestScore: Partial<Record<SessionMode, number>>;
  history: GameRecord[];
  targets: Record<string, TargetStat>;
  daily: Record<string, DailyRecord>;
  recordRound: (key: string, correct: boolean) => void;
  /** Enregistre une partie terminée ; renvoie true si c'est un nouveau record. */
  recordGame: (game: GameRecord, bestStreak: number) => boolean;
  recordDaily: (date: string, record: DailyRecord) => void;
  reset: () => void;
}

const EMPTY = {
  games: 0,
  rounds: 0,
  correct: 0,
  bestStreak: 0,
  bestScore: {},
  history: [],
  targets: {},
  daily: {},
};

export const STATS_STORAGE_KEY = "oq-stats";

export const useStats = create<StatsStore>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      recordRound: (key, correct) =>
        set((s) => {
          const prev = s.targets[key] ?? { hits: 0, misses: 0 };
          return {
            rounds: s.rounds + 1,
            correct: s.correct + (correct ? 1 : 0),
            targets: {
              ...s.targets,
              [key]: correct
                ? { ...prev, hits: prev.hits + 1 }
                : { ...prev, misses: prev.misses + 1 },
            },
          };
        }),
      recordGame: (game, bestStreak) => {
        const prevBest = get().bestScore[game.mode] ?? 0;
        const isRecord = game.score > prevBest && game.score > 0;
        set((s) => ({
          games: s.games + 1,
          bestStreak: Math.max(s.bestStreak, bestStreak),
          bestScore: isRecord ? { ...s.bestScore, [game.mode]: game.score } : s.bestScore,
          history: [game, ...s.history].slice(0, 15),
        }));
        return isRecord;
      },
      recordDaily: (date, record) => set((s) => ({ daily: { ...s.daily, [date]: record } })),
      reset: () => set(EMPTY),
    }),
    { name: STATS_STORAGE_KEY, skipHydration: true },
  ),
);
