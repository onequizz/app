import raw from "@/data/features.json";
import type { FeatureKind, GeoFeature, QuizTheme, TargetKind } from "@/lib/types";

export const FEATURES = raw as GeoFeature[];

export const FEATURE_KINDS: FeatureKind[] = ["river", "lake", "peak", "range", "desert", "sea", "island"];

/** Tous les thèmes, dans l'ordre d'affichage (accueil, paramètres). */
export const QUIZ_THEMES: QuizTheme[] = ["country", "capital", ...FEATURE_KINDS];

const BY_ID = new Map(FEATURES.map((f) => [f.id, f]));

export function getFeature(id: string): GeoFeature {
  const f = BY_ID.get(id);
  if (!f) throw new Error(`Cible inconnue : ${id}`);
  return f;
}

export function findFeature(id: string): GeoFeature | undefined {
  return BY_ID.get(id);
}

export function isFeatureKind(kind: TargetKind): kind is FeatureKind {
  return (FEATURE_KINDS as string[]).includes(kind);
}

/** Les thèmes choisis ont besoin des tracés nature (public/geo/features.json). */
export function themesUseFeatures(themes: readonly QuizTheme[]): boolean {
  return themes.some(isFeatureKind);
}
