import { targetKey, targetPool } from "@/lib/data/countries";
import type { RoundResult, Target, TargetMode, Zone } from "@/lib/types";

// --- Aléatoire reproductible (défi du jour) ---------------------------------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Date locale au format AAAA-MM-JJ. */
export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// --- Règles fixes ------------------------------------------------------------

export const DAILY_RULES = {
  rounds: 10,
  attempts: 3,
  toleranceKm: 75,
  zone: "world" as Zone,
  mode: "mixed" as TargetMode,
};

export const TIME_ATTACK = { startMs: 60_000, bonusMs: 3_000 };
export const HINT_COUNT = 4;

/** Les 10 mêmes cibles pour tout le monde, tirées à partir de la date. */
export function dailyTargets(date: string): Target[] {
  const rand = mulberry32(hashString(`onequizz:${date}`));
  const countries = targetPool(DAILY_RULES.zone, "country");
  const picked = shuffle(countries, rand).slice(0, DAILY_RULES.rounds);
  // Moitié pays, moitié capitales, ordre mélangé.
  return picked.map((t, i) => ({ ...t, kind: i % 2 === 0 ? "country" : "capital" }));
}

// --- Tirage pondéré (répétition espacée légère) ------------------------------

export interface TargetStat {
  hits: number;
  misses: number;
}

export function pickTarget(
  pool: Target[],
  exclude: Set<string>,
  stats: Record<string, TargetStat>,
): Target {
  const candidates = pool.filter((t) => !exclude.has(targetKey(t)));
  const list = candidates.length ? candidates : pool;
  const weights = list.map((t) => {
    const s = stats[targetKey(t)];
    if (!s) return 1;
    // Les cibles souvent ratées reviennent plus souvent.
    return 1 + Math.min(4, Math.max(0, s.misses * 1.5 - s.hits * 0.5));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

export function reviewPool(stats: Record<string, TargetStat>): string[] {
  return Object.entries(stats)
    .filter(([, s]) => s.misses > s.hits)
    .sort(([, a], [, b]) => b.misses - b.hits - (a.misses - a.hits))
    .map(([k]) => k);
}

// --- Score -------------------------------------------------------------------

const ATTEMPT_FACTOR = [1, 0.6, 0.35, 0.2, 0.1];

export function comboMultiplier(streak: number): number {
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

export function computePoints(opts: {
  kind: Target["kind"];
  attemptIndex: number;
  distanceKm: number;
  toleranceKm: number;
  hints: number;
  /** Série en cours, en comptant ce tour réussi. */
  streak: number;
}): number {
  const attempt = ATTEMPT_FACTOR[Math.min(opts.attemptIndex, ATTEMPT_FACTOR.length - 1)];
  const precision =
    opts.kind === "capital"
      ? 1 + 0.5 * Math.max(0, 1 - opts.distanceKm / Math.max(1, opts.toleranceKm))
      : opts.distanceKm === 0
        ? 1.2
        : 1;
  const hint = Math.max(0.2, 1 - 0.2 * opts.hints);
  const raw = 1000 * attempt * precision * hint * comboMultiplier(opts.streak);
  return Math.round(raw / 10) * 10;
}

// --- Chaud / froid -----------------------------------------------------------

export type Heat = "burning" | "hot" | "warm" | "cold" | "freezing";

export function heatOf(distanceKm: number): Heat {
  if (distanceKm < 250) return "burning";
  if (distanceKm < 750) return "hot";
  if (distanceKm < 1500) return "warm";
  if (distanceKm < 3500) return "cold";
  return "freezing";
}

export const HEAT_COLORS: Record<Heat, string> = {
  burning: "#ff3b30",
  hot: "#ff8a00",
  warm: "#ffc93c",
  cold: "#4fb3ff",
  freezing: "#7c8cff",
};

// --- Partage (défi du jour) --------------------------------------------------

export function resultEmoji(r: RoundResult): string {
  if (r.status === "lost") return "🟥";
  if (r.attempts === 1) return "🟩";
  if (r.attempts === 2) return "🟨";
  return "🟧";
}
