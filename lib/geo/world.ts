import type { FeatureCollection, MultiPolygon, Polygon, Feature } from "geojson";

export type CountryFeature = Feature<Polygon | MultiPolygon, { code: string }>;
export type WorldData = FeatureCollection<Polygon | MultiPolygon, { code: string }>;

let worldPromise: Promise<WorldData> | null = null;
let shapeIndex: Map<string, CountryFeature> | null = null;

/** Charge (une seule fois) les frontières Natural Earth générées par scripts/build-data.ts. */
export function loadWorld(): Promise<WorldData> {
  worldPromise ??= fetch("/geo/world.json")
    .then((r) => {
      if (!r.ok) throw new Error(`world.json: ${r.status}`);
      return r.json() as Promise<WorldData>;
    })
    .then((data) => {
      shapeIndex = new Map(data.features.map((f) => [f.properties.code, f]));
      return data;
    })
    .catch((e) => {
      worldPromise = null;
      throw e;
    });
  return worldPromise;
}

/** Polygone d'un pays, si les frontières sont déjà chargées et que le pays en possède un. */
export function getShape(code: string): CountryFeature | undefined {
  return shapeIndex?.get(code);
}
