import type { Feature, FeatureCollection, Geometry } from "geojson";

export type FeatureShape = Feature<Geometry, { id: string }>;

let featuresPromise: Promise<FeatureCollection<Geometry, { id: string }>> | null = null;
let shapeIndex: Map<string, FeatureShape> | null = null;

/** Charge (une seule fois) les tracés des fleuves, lacs, sommets… générés par scripts/build-features.ts. */
export function loadFeatures(): Promise<FeatureCollection<Geometry, { id: string }>> {
  featuresPromise ??= fetch("/geo/features.json")
    .then((r) => {
      if (!r.ok) throw new Error(`features.json: ${r.status}`);
      return r.json() as Promise<FeatureCollection<Geometry, { id: string }>>;
    })
    .then((data) => {
      shapeIndex = new Map(data.features.map((f) => [f.properties.id, f]));
      return data;
    })
    .catch((e) => {
      featuresPromise = null;
      throw e;
    });
  return featuresPromise;
}

/** Tracé d'une cible nature, si les tracés sont déjà chargés. */
export function getFeatureShape(id: string): FeatureShape | undefined {
  return shapeIndex?.get(id);
}
