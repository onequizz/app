import { getFeature, isFeatureKind } from "@/lib/data/features";
import type { Target } from "@/lib/types";

export type HintKey = "region" | "flag" | "population" | "country" | "capital" | "measure" | "initial";

/** Indices disponibles pour une cible, dans l'ordre où ils se dévoilent. */
export function hintKeys(target: Target): HintKey[] {
  if (!isFeatureKind(target.kind)) {
    return ["region", "flag", "population", target.kind === "capital" ? "country" : "capital"];
  }
  const f = getFeature(target.code);
  const keys: HintKey[] = [];
  if (f.region) keys.push("region");
  // Pas d'indice « pays » : cliquer dans l'un des pays de la cible est justement la réponse.
  if (f.elevation ?? f.length ?? f.area) keys.push("measure");
  keys.push("initial");
  return keys;
}
