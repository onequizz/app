import type { Locale } from "@/lib/i18n/config";

export type Region = "europe" | "asia" | "africa" | "americas" | "oceania";
export type Zone = "world" | Region;
/** Cibles « nature » (scripts/build-features.ts). */
export type FeatureKind = "river" | "lake" | "peak" | "range" | "desert" | "sea" | "island";
export type TargetKind = "country" | "capital" | FeatureKind;
/** Thème de quiz : une partie en mélange un ou plusieurs. */
export type QuizTheme = "country" | "capital" | FeatureKind;
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

export interface GeoFeature {
  /** Élément Wikidata (ex. Q3392 pour le Nil). */
  id: string;
  kind: FeatureKind;
  names: LocalizedNames;
  /** null : océans et Antarctique, proposés seulement en « Monde entier ». */
  region: Region | null;
  /** Point d'étiquette [lat, lng]. */
  anchor: [number, number];
  /** [ouest, sud, est, nord] */
  bbox: [number, number, number, number];
  /** Pays traversés, du plus au moins concerné. */
  countries: string[];
  /** Altitude (m), longueur (km), superficie (km²) selon le type. */
  elevation: number | null;
  length: number | null;
  area: number | null;
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
