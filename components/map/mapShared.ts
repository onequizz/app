import { setWorkerUrl } from "maplibre-gl";
import type { Feature, FeatureCollection, LineString } from "geojson";

// Utilitaires communs aux cartes du jeu et de l'atlas.

export type Palette = Record<
  "ocean" | "land" | "landHover" | "border" | "graticule" | "accent" | "success" | "reveal" | "danger",
  string
>;

export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  return {
    ocean: v("--map-ocean"),
    land: v("--map-land"),
    landHover: v("--map-land-hover"),
    border: v("--map-border"),
    graticule: v("--map-graticule"),
    accent: v("--accent"),
    success: v("--success"),
    reveal: v("--reveal"),
    danger: v("--danger"),
  };
}

export function graticule(step = 15): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  for (let lng = -180; lng <= 180; lng += step) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: Array.from({ length: 33 }, (_, i) => [lng, -80 + i * 5]) },
    });
  }
  for (let lat = -75; lat <= 75; lat += step) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat]) },
    });
  }
  return { type: "FeatureCollection", features };
}

export const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

// Worker servi depuis public/ (copié par scripts/copy-maplibre-worker.mjs).
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export function markerEl(color: string, label?: string, variant: "guess" | "target" = "guess", pulse = false) {
  const el = document.createElement("div");
  el.className = `oq-marker oq-marker--${variant}`;
  el.style.setProperty("--c", color);
  if (pulse) el.insertAdjacentHTML("beforeend", '<span class="oq-marker__pulse"></span>');
  el.insertAdjacentHTML("beforeend", '<span class="oq-marker__dot"></span>');
  if (label) {
    const l = document.createElement("span");
    l.className = "oq-marker__label";
    l.textContent = label;
    el.appendChild(l);
  }
  return el;
}

/** Étiquette seule (sans point), posée au-dessus d'une position. */
export function labelEl(color: string, label: string) {
  const el = document.createElement("div");
  el.className = "oq-marker";
  el.style.setProperty("--c", color);
  const l = document.createElement("span");
  l.className = "oq-marker__label";
  l.textContent = label;
  el.appendChild(l);
  return el;
}
