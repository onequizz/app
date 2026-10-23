import type { Locale } from "@/lib/i18n/config";

export type Region = "europe" | "asia" | "africa" | "americas" | "oceania";
export type Zone = "world" | Region;
export type TargetKind = "country" | "capital";
export type TargetMode = "country" | "capital" | "mixed";
export type SessionMode = "classic" | "timeAttack" | "daily" | "review";

export type LocalizedNames = Record<Locale, string>;

export interface Country {
  code: string;
  region: Region;
  subregion: string;
  names: LocalizedNames;
  capital: { lat: number; lng: number; names: LocalizedNames } | null;
  /** [lat, lng] */
  center: [number, number];
  area: number;
  population: number | null;
  flag: string;
  /** [ouest, sud, est, nord] — null si pas de polygone à l'échelle 1:50m */
  bbox: [number, number, number, number] | null;
  wiki: Record<Locale, string | null>;
}

export interface Target {
  kind: TargetKind;
  code: string;
}

export interface LngLat {
  lng: number;
  lat: number;
}

export interface Guess extends LngLat {
  distanceKm: number;
  correct: boolean;
  /** Point de la cible le plus proche du clic (capitale ou frontière). */
  nearest: LngLat;
}

export type RoundStatus = "playing" | "won" | "lost";

export interface RoundResult {
  target: Target;
  status: Exclude<RoundStatus, "playing">;
  attempts: number;
  hints: number;
  points: number;
  bestDistanceKm: number;
}
