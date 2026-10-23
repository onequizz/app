import { create } from "zustand";
import { sfx } from "@/lib/audio/sfx";
import { parseTargetKey, targetKey, targetPool } from "@/lib/data/countries";
import {
  comboMultiplier,
  computePoints,
  DAILY_RULES,
  dailyTargets,
  pickTarget,
  resultEmoji,
  reviewPool,
  shuffle,
  TIME_ATTACK,
  todayKey,
} from "@/lib/game/engine";
import { evaluateGuess } from "@/lib/geo/validate";
import type {
  Guess,
  LngLat,
  RoundResult,
  RoundStatus,
  SessionMode,
  Target,
  TargetMode,
  Zone,
} from "@/lib/types";
import { useStats } from "@/store/stats";

export type Phase = "idle" | "spinning" | "guessing" | "roundEnd" | "finished";

export interface Rules {
  attempts: number;
  toleranceKm: number;
  zone: Zone;
  mode: TargetMode;
  rounds: number;
}

export type GameEvent =
  | { id: number; type: "miss"; distanceKm: number; attemptsLeft: number }
  | { id: number; type: "lost"; distanceKm: number }
  | { id: number; type: "won"; distanceKm: number; points: number; multiplier: number };

interface GameStore {
  phase: Phase;
  session: SessionMode;
  rules: Rules;
  /** Cibles imposées (défi du jour, révision) ; null = tirage libre. */
  queue: Target[] | null;
  used: string[];
  totalRounds: number | null;
  score: number;
  streak: number;
  bestStreak: number;
  results: RoundResult[];
  timeLeftMs: number;
  newRecord: boolean;
  dailyDate: string | null;

  target: Target | null;
  guesses: Guess[];
  hints: number;
  roundStatus: RoundStatus;
  roundPoints: number;
  practice: boolean;
  event: GameEvent | null;

  start: (session: SessionMode, rules: Rules) => boolean;
  beginRound: () => void;
  spinDone: () => void;
  guess: (p: LngLat) => void;
  takeHint: () => void;
  retryRound: () => void;
  nextRound: () => void;
  tick: (ms: number) => void;
  finish: () => void;
  reset: () => void;
}

let eventId = 0;

const ROUND_RESET = {
  target: null,
  guesses: [],
  hints: 0,
  roundStatus: "playing" as RoundStatus,
  roundPoints: 0,
  practice: false,
  event: null,
};

export const useGame = create<GameStore>()((set, get) => ({
  phase: "idle",
  session: "classic",
  rules: { ...DAILY_RULES },
  queue: null,
  used: [],
  totalRounds: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  results: [],
  timeLeftMs: 0,
  newRecord: false,
  dailyDate: null,
  ...ROUND_RESET,

  start: (session, settingsRules) => {
    let rules = settingsRules;
    let queue: Target[] | null = null;
    let totalRounds: number | null = rules.rounds;
    let dailyDate: string | null = null;

    if (session === "daily") {
      dailyDate = todayKey();
      rules = { ...DAILY_RULES };
      queue = dailyTargets(dailyDate);
      totalRounds = queue.length;
    } else if (session === "review") {
      const keys = reviewPool(useStats.getState().targets);
      if (!keys.length) return false;
      queue = shuffle(keys.map(parseTargetKey)).slice(0, rules.rounds);
      totalRounds = queue.length;
    } else if (session === "timeAttack") {
      totalRounds = null;
    }

    set({
      phase: "idle",
      session,
      rules,
      queue,
      used: [],
      totalRounds,
      score: 0,
      streak: 0,
      bestStreak: 0,
      results: [],
      timeLeftMs: session === "timeAttack" ? TIME_ATTACK.startMs : 0,
      newRecord: false,
      dailyDate,
      ...ROUND_RESET,
    });
    get().beginRound();
    return true;
  },

  beginRound: () => {
    const { queue, results, rules, used } = get();
    let target: Target;
    if (queue) {
      target = queue[results.length];
    } else {
      const pool = targetPool(rules.zone, rules.mode);
      target = pickTarget(pool, new Set(used), useStats.getState().targets);
    }
    set({ ...ROUND_RESET, target, used: [...used, targetKey(target)], phase: "spinning" });
  },

  spinDone: () => {
    if (get().phase === "spinning") set({ phase: "guessing" });
  },

  guess: (p) => {
    const s = get();
    if (s.phase !== "guessing" || !s.target) return;
    const ev = evaluateGuess(s.target, p, s.rules.toleranceKm);
    const guesses: Guess[] = [
      ...s.guesses,
      { ...p, distanceKm: ev.distanceKm, correct: ev.correct, nearest: ev.nearest },
    ];
    const attemptIndex = guesses.length - 1;
    const best = Math.min(...guesses.map((g) => g.distanceKm));
    const key = targetKey(s.target);

    if (ev.correct) {
      const streak = s.practice ? s.streak : s.streak + 1;
      const points = s.practice
        ? 0
        : computePoints({
            kind: s.target.kind,
            attemptIndex,
            distanceKm: ev.distanceKm,
            toleranceKm: s.rules.toleranceKm,
            hints: s.hints,
            streak,
          });
      const multiplier = comboMultiplier(streak);
      if (multiplier > comboMultiplier(s.streak) && !s.practice) sfx.combo(multiplier);
      else sfx.success();

      const result: RoundResult = {
        target: s.target,
        status: "won",
        attempts: guesses.length,
        hints: s.hints,
        points,
        bestDistanceKm: best,
      };
      if (!s.practice) useStats.getState().recordRound(key, true);
      set({
        guesses,
        roundStatus: "won",
        roundPoints: points,
        phase: "roundEnd",
        score: s.score + points,
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
        results: s.practice ? s.results : [...s.results, result],
        timeLeftMs: s.session === "timeAttack" ? s.timeLeftMs + TIME_ATTACK.bonusMs : s.timeLeftMs,
        event: { id: ++eventId, type: "won", distanceKm: ev.distanceKm, points, multiplier },
      });
      return;
    }

    if (guesses.length >= s.rules.attempts) {
      sfx.reveal();
      const result: RoundResult = {
        target: s.target,
        status: "lost",
        attempts: guesses.length,
        hints: s.hints,
        points: 0,
        bestDistanceKm: best,
      };
      if (!s.practice) useStats.getState().recordRound(key, false);
      set({
        guesses,
        roundStatus: "lost",
        phase: "roundEnd",
        streak: s.practice ? s.streak : 0,
        results: s.practice ? s.results : [...s.results, result],
        event: { id: ++eventId, type: "lost", distanceKm: ev.distanceKm },
      });
      return;
    }

    sfx.miss();
    set({
      guesses,
      event: {
        id: ++eventId,
        type: "miss",
        distanceKm: ev.distanceKm,
        attemptsLeft: s.rules.attempts - guesses.length,
      },
    });
  },

  takeHint: () => {
    const { phase, hints } = get();
    if (phase === "guessing" && hints < 4) {
      sfx.click();
      set({ hints: hints + 1 });
    }
  },

  retryRound: () => {
    const { target } = get();
    if (!target) return;
    set({ ...ROUND_RESET, target, practice: true, phase: "guessing" });
  },

  nextRound: () => {
    const { totalRounds, results, session, timeLeftMs } = get();
    if (session === "timeAttack" && timeLeftMs <= 0) return get().finish();
    if (totalRounds !== null && results.length >= totalRounds) return get().finish();
    get().beginRound();
  },

  tick: (ms) => {
    const { session, phase, timeLeftMs } = get();
    if (session !== "timeAttack" || phase !== "guessing") return;
    const left = Math.max(0, timeLeftMs - ms);
    set({ timeLeftMs: left });
    if (left === 0) get().finish();
  },

  finish: () => {
    const s = get();
    if (s.phase === "finished") return;
    const stats = useStats.getState();
    const correct = s.results.filter((r) => r.status === "won").length;
    const newRecord = stats.recordGame(
      { mode: s.session, score: s.score, correct, total: s.results.length, date: todayKey() },
      s.bestStreak,
    );
    if (s.session === "daily" && s.dailyDate) {
      stats.recordDaily(s.dailyDate, {
        score: s.score,
        correct,
        grid: s.results.map(resultEmoji).join(""),
      });
    }
    sfx.finish();
    set({ phase: "finished", newRecord });
  },

  reset: () => set({ phase: "idle", ...ROUND_RESET }),
}));
